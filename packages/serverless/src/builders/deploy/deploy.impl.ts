import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, from, zip } from 'rxjs';
import { concatMap, tap, mergeMap, map, filter, first } from 'rxjs/operators';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';
import { ChildProcess, fork } from 'child_process';
import { ServerlessBuildEvent, BuildServerlessBuilderOptions } from '../build/build.impl';
import * as isBuiltinModule from 'is-builtin-module';
import * as _ from 'lodash';
import { ServerlessWrapper } from '../../utils/serverless';
import * as path from 'path';
import { packager } from '../../utils/packagers/index';
import { Yarn } from '../../utils/packagers/yarn';
import { NPM } from '../../utils/packagers/npm';

/* Fix for EMFILE: too many open files on serverless deploy */
import * as fs from 'fs';
import * as gracefulFs from 'graceful-fs';
gracefulFs.gracefulify(fs)
/* Fix for EMFILE: too many open files on serverless deploy */

try {
  require('dotenv').config();
} catch (e) { }

export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk'
}

// review: Have to spin off options and clarify schema.json for deploy,build,serve
export interface ServerlessDeployBuilderOptions extends BuildServerlessBuilderOptions {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  function: string;
  host: string;
  port: number;
  watch: boolean;
  args: string[];
  package: string;
}

export default createBuilder<ServerlessDeployBuilderOptions & JsonObject>(serverlessExecutionHandler);
export function serverlessExecutionHandler(
  options: JsonObject & ServerlessDeployBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  // build into output path before running serverless offline.

  return ServerlessWrapper.init(options, context).pipe(
    mergeMap(() => {
      return runWaitUntilTargets(options, context).pipe(
        concatMap(v => {
          if (!v.success) {
            context.logger.error(
              `One of the tasks specified in waitUntilTargets failed`
            );
            return of({ success: false });
          }
        return startBuild(options, context);
      }));
    }),
    concatMap((event: ServerlessBuildEvent) => {
      if (event.success) {
        ServerlessWrapper.serverless.cli.log("getting external modules");
        var externals = getExternalModules(event.webpackStats);
        const originPackageJsonPath = path.join('./', 'package.json');
        const packageJsonPath = path.join(options.package, 'package.json');
        const packageJson = ServerlessWrapper.serverless.utils.readFileSync(originPackageJsonPath);

        //First create a package.json with first level dependencies
        ServerlessWrapper.serverless.cli.log("create a package.json with first level dependencies");
        const prodModules = getProdModules(externals, packageJson, originPackageJsonPath, [], {}, options.verbose);
        createPackageJson(prodModules, packageJsonPath, originPackageJsonPath);

        // Get the packager for the current process.
        let packagerInstance = null;
        if (packager("yarn")) {
          packagerInstance = Yarn;
        } else if (packager("npm")) {
          packagerInstance = NPM;
        }
        else {
          throw Error("No Packager to process package.json, please install npm or yarn");
        }

        //got to generate lock entry for yarn for dependency graph to work.
        if (packager("yarn")) {
          ServerlessWrapper.serverless.cli.log("generate lock entry for yarn for dependency graph to work.");
          const result = packagerInstance.generateLockFile(path.dirname(packageJsonPath));
          if (result.error) {
            ServerlessWrapper.serverless.cli.log("ERROR: generating lock file!");
            throw Error(result.error.toString())
          }
          ServerlessWrapper.serverless.utils.writeFileSync(path.join(options.package, packagerInstance.lockfileName), result.stdout.toString());
        }

        // Get the packagelist with dependency graph and depth=2 level
        // review: Change depth to options?
        // review: Should I change everything to spawnsync for the pacakagers?
        ServerlessWrapper.serverless.cli.log("get the packagelist with dependency graph and depth=2 level");
        let packageList: ChildProcess = packagerInstance.getProdDependencies(path.dirname(packageJsonPath), 1, 2)
        return from(new Promise<BuilderOutput>(() => {
          let dependencyGraph = null;
          packageList.stdout.on('data', data => {
            if (packager("yarn")) {
              dependencyGraph = convertDependencyTrees(JSON.parse(data.toString()));
            } else if (packager("npm")) {
              dependencyGraph = JSON.parse(data.toString());
            }
            const problems = _.get(dependencyGraph, 'problems', []);
            if (options.verbose && !_.isEmpty(problems)) {
              ServerlessWrapper.serverless.cli.log(`Ignoring ${_.size(problems)} NPM errors:`);
              _.forEach(problems, problem => {
                ServerlessWrapper.serverless.cli.log(`=> ${problem}`);
              });
            }
            // re-writing package.json with dependency-graphs
            ServerlessWrapper.serverless.cli.log("re-writing package.json with dependency-graphs");
            const prodModules = getProdModules(externals, packageJson, originPackageJsonPath, [], dependencyGraph, options.verbose);
            createPackageJson(prodModules, packageJsonPath, originPackageJsonPath);
            // run packager to  install node_modules
            ServerlessWrapper.serverless.cli.log("run packager to  install node_modules");
            const packageInstallResult = packagerInstance.install(path.dirname(packageJsonPath), { ignoreScripts: true });
            if (packageInstallResult.error) {
              ServerlessWrapper.serverless.cli.log("ERROR: install package error!");
              throw Error(packageInstallResult.error.toString())
            }
            ServerlessWrapper.serverless.cli.log(packageInstallResult.stdout.toString());
            // change servicePath to distribution location
            // review: Change options from location to outputpath?\
            const servicePath = ServerlessWrapper.serverless.config.servicePath;
            ServerlessWrapper.serverless.config.servicePath = options.location;
            ServerlessWrapper.serverless.processedInput = { commands: ['deploy'], options: getExecArgv(options) };
            return ServerlessWrapper.serverless.run().then((result) => {
              // change servicePath back for further processing.
              ServerlessWrapper.serverless.config.servicePath = servicePath;
              return Promise.resolve({ success: true });
            }).catch(ex => {
              // returning error from run promise.
              throw new Error(ex);
            });
          });
          packageList.stderr.on('data', error => {
            return Promise.resolve({ success: false, error: `child exited with error ${error}` });
          });
          packageList.on('exit', code => {
            return Promise.resolve({ success: false, error: `child exited with code ${code}` });
          });
        }
        ))
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

/**
 * Remove a given list of excluded modules from a module list
 */
// function removeExcludedModules(modules, packageForceExcludes, log) {
//   const excludedModules = _.remove(modules, externalModule => {   // eslint-disable-line lodash/prefer-immutable-method
//     const splitModule = _.split(externalModule, '@');
//     console.log(splitModule);
//     // If we have a scoped module we have to re-add the @
//     if (_.startsWith(externalModule, '@')) {
//       splitModule.splice(0, 1);
//       splitModule[0] = '@' + splitModule[0];
//     }
//     const moduleName = _.first(splitModule);
//     return _.includes(packageForceExcludes, moduleName);
//   });

//   console.log(excludedModules);
//   if (log && !_.isEmpty(excludedModules)) {
//     ServerlessWrapper.serverless.cli.log(`Excluding external modules: ${_.join(excludedModules, ', ')}`);
//   }
// }

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
  if(options.function && options.function != '') {
    args.push('function');
  }
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined && key !== 'buildTarget' && key !== 'package') {
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
      "package-yarn": "yarn",
      "package-npm": "npm install"
    }
  }, {});
  addModulesToPackageJson(externalModules, compositePackage, pathToPackageRoot); // for rebase , relPath
  ServerlessWrapper.serverless.utils.writeFileSync(packageJsonPath, JSON.stringify(compositePackage, null, 2));
}

function getProdModules(externalModules, packageJson, packagePath, forceExcludes, dependencyGraph, verbose = false) {
  const prodModules = [];
  // only process the module stated in dependencies section
  if (!packageJson.dependencies) {
    return [];
  }
  // Get versions of all transient modules
  _.forEach(externalModules, module => {
    let moduleVersion = packageJson.dependencies[module.external];
    if (moduleVersion) {
      prodModules.push(`${module.external}@${moduleVersion}`);
      // Check if the module has any peer dependencies and include them too
      try {
        const modulePackagePath = path.join(
          path.dirname(path.join(process.cwd(), packagePath)),
          'node_modules',
          module.external,
          'package.json'
        );
        const peerDependencies = require(modulePackagePath).peerDependencies;
        if (!_.isEmpty(peerDependencies)) {
          verbose && ServerlessWrapper.serverless.cli.log(`Adding explicit peers for dependency ${module.external}`);
          const peerModules = getProdModules.call(this, _.map(peerDependencies, (value, key) => ({ external: key })), packagePath, dependencyGraph, forceExcludes);
          Array.prototype.push.apply(prodModules, peerModules);
        }
      } catch (e) {
        ServerlessWrapper.serverless.cli.log(`WARNING: Could not check for peer dependencies of ${module.external}`);
      }
    } else {
      if (!packageJson.devDependencies || !packageJson.devDependencies[module.external] && dependencyGraph.dependencies) {
        // Add transient dependencies if they appear not in the service's dev dependencies

        const originInfo = _.get(dependencyGraph, 'dependencies', {})[module.external] || {};
        moduleVersion = _.get(originInfo, 'version', null);
        if (!moduleVersion) {
          ServerlessWrapper.serverless.cli.log(`WARNING: Could not determine version of module ${module.external}`);
        }
        prodModules.push(moduleVersion ? `${module.external}@${moduleVersion}` : module.external);
      } else if (packageJson.devDependencies && packageJson.devDependencies[module.external] && !_.includes(forceExcludes, module.external)) {
        // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
        // most likely set in devDependencies and should not lead to an error now.
        const ignoredDevDependencies = ['aws-sdk'];
        if (!_.includes(ignoredDevDependencies, module.external)) {
          // Runtime dependency found in devDependencies but not forcefully excluded
          ServerlessWrapper.serverless.cli.log(`ERROR: Runtime dependency '${module.external}' found in devDependencies. Move it to dependencies or use forceExclude to explicitly exclude it.`);
          throw new ServerlessWrapper.serverless.classes.Error(`Serverless-webpack dependency error: ${module.external}.`);
        }
        verbose && ServerlessWrapper.serverless.cli.log(`INFO: Runtime dependency '${module.external}' found in devDependencies. It has been excluded automatically.`);
      }
    }
  });
  return prodModules;
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

  return moduleVersion;
}

function getExternalModules(stats: any) {
  if (!stats.chunks) {
    return [];
  }
  const externals = new Set();
  for (const chunk of stats.chunks) {
    if (!chunk.modules) {
      continue;
    }

    // Explore each module within the chunk (built inputs):
    for (const module of chunk.modules) {
      if (isExternalModule(module)) {
        externals.add({
          origin: module.issuer,
          external: getExternalModuleName(module)
        });
      }
    }
  }
  return Array.from(externals);
}

function getExternalModuleName(module) {
  const path = /^external "(.*)"$/.exec(module.identifier)[1];
  const pathComponents = path.split('/');
  const main = pathComponents[0];

  // this is a package within a namespace
  if (main.charAt(0) == '@') {
    return `${main}/${pathComponents[1]}`;
  }

  return main;
}

function isExternalModule(module) {
  return _.startsWith(module.identifier, 'external ') && !isBuiltinModule(getExternalModuleName(module));
}
