import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, from, zip } from 'rxjs';
import { concatMap, tap, map, filter, first } from 'rxjs/operators';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';
import { ServerlessBuildEvent } from '../build/build.impl';
import * as _ from 'lodash';
import { ServerlessWrapper } from '../../utils/serverless';
import * as path from 'path';
import { packager } from '../../utils/packagers/index';
import { Yarn } from '../../utils/packagers/yarn';
import { NPM } from '../../utils/packagers/npm';

/* Fix for EMFILE: too many open files on serverless deploy */
import * as fs from 'fs';
import * as gracefulFs from 'graceful-fs';
import { readJsonFile } from '@nrwl/workspace';
import { writeJsonFile, writeToFile } from '@nrwl/workspace/src/utils/fileutils';
import { DependencyResolver } from '../../utils/types';
import { WebpackDependencyResolver } from '../../utils/webpack.stats';
gracefulFs.gracefulify(fs)
/* Fix for EMFILE: too many open files on serverless deploy */
export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk'
}

// review: Have to spin off options and clarify schema.json for deploy,build,serve
export interface ServerlessDeployBuilderOptions extends JsonObject {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  function: string;
  host: string;
  port: number;
  watch: boolean;
  args: string[];
  package: string;
  location: string;
  stage: string;
  list: boolean;
  updateConfig: boolean;
  verbose?: boolean;
}

export default createBuilder<ServerlessDeployBuilderOptions & JsonObject>(serverlessExecutionHandler);
export function serverlessExecutionHandler(
  options: JsonObject & ServerlessDeployBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  // build into output path before running serverless offline.
  return runWaitUntilTargets(options, context).pipe(
    concatMap(v => {
      if (!v.success) {
        context.logger.error(
          'One of the tasks specified in waitUntilTargets failed'
        );
        return of({ success: false });
      }
      return startBuild(options, context);
    }),
    concatMap((event: ServerlessBuildEvent) => {
      if (event.success) {
        preparePackageJson(options, context, event.webpackStats, event.resolverName)
        // change servicePath to distribution location
        // review: Change options from location to outputpath?\
        const servicePath = ServerlessWrapper.serverless.config.servicePath;
        ServerlessWrapper.serverless.config.servicePath = options.location;
        ServerlessWrapper.serverless.processedInput = { commands: ['deploy'], options: getExecArgv(options) };
        return new Observable<BuilderOutput>((option) => {
          ServerlessWrapper.serverless.run().then(() => {
            // change servicePath back for further processing.
            ServerlessWrapper.serverless.config.servicePath = servicePath;
            option.next({ success: true });
            option.complete();
          }).catch(ex => {
            option.next({ success: false, error: ex.toString() });
            option.complete();
          })
        }).pipe(concatMap((result => {
          return of(result);
        })))
      }
      else {
        context.logger.error(
          'There was an error with the build. See above.'
        );
        context.logger.info(`${event.outfile} was not restarted.`);
        return of(event);
      }
    })
  );
}
function runWaitUntilTargets(
  options: ServerlessDeployBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  if (!options.waitUntilTargets || options.waitUntilTargets.length === 0)
    return of({ success: true });
  return zip(
    ...options.waitUntilTargets.map(b => {
      return scheduleTargetAndForget(context, targetFromTargetString(b)).pipe(
        filter(e => e.success !== undefined),
        first()
      );
    })
  ).pipe(
    map(results => {
      return { success: !results.some(r => !r.success) };
    })
  );
}

function preparePackageJson(options: JsonObject & ServerlessDeployBuilderOptions,
  context: BuilderContext, stats: any, resolverName: string) {
  
  const resolver = resolverFactory(resolverName)
  context.logger.info('getting external modules');
  const workspacePackageJsonPath = path.join(context.workspaceRoot, 'package.json');
  const packageJsonPath = path.join(options.package, 'package.json');
  const packageJson = readJsonFile(workspacePackageJsonPath);
  //First create a package.json with first level dependencies
  context.logger.info('create a package.json with first level dependencies');
  let prodModules = resolver.normalizeExternalDependencies(packageJson, workspacePackageJsonPath, options.verbose, stats);
  
  createPackageJson(prodModules, packageJsonPath, workspacePackageJsonPath);
  // Get the packager for the current process.
  let packagerInstance = null;
  if (packager('yarn')) {
    packagerInstance = Yarn;
  } else if (packager('npm')) {
    packagerInstance = NPM;
  }
  else {
    return of({ success: false, error: 'No Packager to process package.json, please install npm or yarn' });
  }
  //got to generate lock entry for yarn for dependency graph to work.
  if (packager('yarn')) {
    context.logger.info('generate lock entry for yarn for dependency graph to work.');
    const result = packagerInstance.generateLockFile(path.dirname(packageJsonPath));
    if (result.error) {
      context.logger.error('ERROR: generating lock file!');
      return of({ success: false, error: result.error.toString() });
    }
    writeToFile(path.join(options.package, packagerInstance.lockfileName), result.stdout.toString());
  }

  // Get the packagelist with dependency graph and depth=2 level
  // review: Change depth to options?
  // review: Should I change everything to spawnsync for the pacakagers?
  context.logger.info('get the packagelist with dependency graph and depth=2 level');
  const getDependenciesResult = packagerInstance.getProdDependencies(path.dirname(packageJsonPath), 1, 4);
  if (getDependenciesResult.error) {
    context.logger.error('ERROR: getDependenciesResult!');
    return of({ success: false, error: getDependenciesResult.error.toString() });
  }
  const data = getDependenciesResult.stdout.toString();
  let dependencyGraph = null;
  if (packager('yarn')) {
    dependencyGraph = convertDependencyTrees(JSON.parse(data.toString()));
  } else if (packager('npm')) {
    dependencyGraph = JSON.parse(data.toString());
  }
  const problems = _.get(dependencyGraph, 'problems', []);
  if (options.verbose && !_.isEmpty(problems)) {
    context.logger.info(`Ignoring ${_.size(problems)} NPM errors:`);
    _.forEach(problems, problem => {
      context.logger.info(`=> ${problem}`);
    });
  }
  // re-writing package.json with dependency-graphs
  context.logger.info('re-writing package.json with dependency-graphs');
  prodModules = resolver.normalizeExternalDependencies(packageJson, workspacePackageJsonPath, options.verbose, stats, dependencyGraph);
  console.log(prodModules)
  createPackageJson(prodModules, packageJsonPath, workspacePackageJsonPath);
  // run packager to  install node_modules
  context.logger.info('run packager to  install node_modules');
  const packageInstallResult = packagerInstance.install(path.dirname(packageJsonPath), { ignoreScripts: true });
  if (packageInstallResult.error) {
    context.logger.error('ERROR: install package error!');
    return of({ success: false, error: packageInstallResult.error.toString() });
  }
  context.logger.info(packageInstallResult.stdout.toString());
}

function resolverFactory(resolverName: string): DependencyResolver {
  // Dont know how to reflect class using type string???
  // const resolver = Object.create(window[resolverName].prototype);
  if(resolverName === 'WebpackDependencyResolver') {
    return new WebpackDependencyResolver()
  } else {
    throw `Resolver ${resolverName} does not exists`;
  }
}

function convertDependencyTrees(parsedTree) {
  const convertTrees = trees => _.reduce(trees, (__, tree) => {
    const splitModule = _.split(tree.name, '@');
    // If we have a scoped module we have to re-add the @
    if (_.startsWith(tree.name, '@')) {
      splitModule.splice(0, 1);
      splitModule[0] = '@' + splitModule[0];
    }
    __[_.first(splitModule)] = {
      version: _.join(_.tail(splitModule), '@'),
      dependencies: convertTrees(tree.children)
    };
    return __;
  }, {});
  const trees = _.get(parsedTree, 'data.trees', []);
  const result = {
    problems: [],
    dependencies: convertTrees(trees)
  };
  return result;
};

function startBuild(
  options: ServerlessDeployBuilderOptions,
  context: BuilderContext
): Observable<ServerlessBuildEvent> {
  const target = targetFromTargetString(options.buildTarget);
  return from(
    Promise.all([
      context.getTargetOptions(target),
      context.getBuilderNameForTarget(target)
    ]).then(([options, builderName]) =>
      context.validateOptions(options, builderName)
    )
  ).pipe(
    tap(options => {
      if (options.optimization) {
        context.logger.info(stripIndents`
              ************************************************
              This is a custom wrapper of serverless deploy
              ************************************************`);
      }
    }),
    concatMap(
      () =>
        scheduleTargetAndForget(context, target, {
          watch: false
        }) as unknown as Observable<ServerlessBuildEvent>
    )
  );
}

function getExecArgv(options: ServerlessDeployBuilderOptions) {
  const args = [];
  if (options.function && options.function != '') {
    args.push('function');
  }
  if (options.list) {
    args.push('list');
  }
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined && key !== 'buildTarget' && key !== 'package' && key !== 'list') {
        args.push(`--${key}=${options[key]}`);
      }
    }
  }

  return args;
}

function createPackageJson(externalModules, packageJsonPath, pathToPackageRoot) {
  const compositePackage = _.defaults({
    name: ServerlessWrapper.serverless.service.service,
    version: '1.0.0',
    description: `Packaged externals for ${ServerlessWrapper.serverless.service.service}`,
    private: true,
    scripts: {
      'package-yarn': 'yarn',
      'package-npm': 'npm install'
    }
  }, {});
  addModulesToPackageJson(externalModules, compositePackage, pathToPackageRoot); // for rebase , relPath
  writeJsonFile(packageJsonPath, compositePackage)
}

function addModulesToPackageJson(externalModules, packageJson, pathToPackageRoot) { // , pathToPackageRoot
  _.forEach(externalModules, externalModule => {
    const splitModule = _.split(externalModule, '@');
    // If we have a scoped module we have to re-add the @
    if (_.startsWith(externalModule, '@')) {
      splitModule.splice(0, 1);
      splitModule[0] = '@' + splitModule[0];
    }
    let moduleVersion = _.join(_.tail(splitModule), '@');
    // We have to rebase file references to the target package.json
    moduleVersion = rebaseFileReferences(pathToPackageRoot, moduleVersion);
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies[_.first(splitModule)] = moduleVersion;
  });
}

function rebaseFileReferences(pathToPackageRoot, moduleVersion) {
  if (/^(?:file:[^/]{2}|\.\/|\.\.\/)/.test(moduleVersion)) {
    const filePath = _.replace(moduleVersion, /^file:/, '');
    return _.replace(`${_.startsWith(moduleVersion, 'file:') ? 'file:' : ''}${pathToPackageRoot}/${filePath}`, /\\/g, '/');
  }
  if (moduleVersion === '') {
    moduleVersion = '*'
  }
  return moduleVersion;
}





