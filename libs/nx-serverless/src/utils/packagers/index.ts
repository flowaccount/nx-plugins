/**
 * Factory for supported packagers.
 *
 * All packagers must implement the following interface:
 *
 * interface Packager {
 *
 * static get lockfileName(): string;
 * static get copyPackageSectionNames(): Array<string>;
 * static get mustCopyModules(): boolean;
 * static getProdDependencies(cwd: string, depth: number = 1): BbPromise<Object>;
 * static rebaseLockfile(pathToPackageRoot: string, lockfile: Object): void;
 * static install(cwd: string): BbPromise<void>;
 * static prune(cwd: string): BbPromise<void>;
 * static runScripts(cwd: string, scriptNames): BbPromise<void>;
 *
 * }
 */

import * as _ from 'lodash';
import { NPM } from './npm';
import { Yarn } from './yarn';
import { getProjectRoot } from '../normalize';
import { DependencyResolver, ServerlessDeployBuilderOptions, ServerlessSlsBuilderOptions, SimpleBuildEvent } from '../types';
import { WebpackDependencyResolver } from '../webpack.stats';
import { DependencyCheckResolver } from '../depcheck';
import { ServerlessWrapper } from '../serverless';
import { join, dirname } from 'path';
import { ExecutorContext, logger,  writeJsonFile, readJsonFile } from '@nrwl/devkit';
import { StatsCompilation } from 'webpack';

const registeredPackagers = {
  npm: NPM,
  yarn: Yarn,
};

/**
 * Factory method.
 * @this ServerlessWebpack - Active plugin instance
 * @param {string} packagerId - Well known packager id.
 */
export function packager(packagerId) {
  if (!_.has(registeredPackagers, packagerId)) {
    const message = `Could not find packager '${packagerId}'`;
    throw message;
  }
  return registeredPackagers[packagerId];
}

export async function preparePackageJson(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions,
  context: ExecutorContext,
  stats: StatsCompilation,
  resolverName: string,
  tsconfig?: string
): Promise<SimpleBuildEvent> {
  const resolver = resolverFactory(resolverName, context);
  const workspacePackageJsonPath = join(context.root, 'package.json');
  const packageJsonPath = join(options.package, 'package.json');
  const packageJson = readJsonFile(workspacePackageJsonPath);
  logger.info(`getting external modules and compilingh into ${packageJsonPath}`);
  logger.info('create a package.json with first level dependencies'); //First create a package.json with first level dependencies
  logger.info(tsconfig)
  // Get the packager for the current process.
  let packagerInstance = null;
  if (options.packager && options.packager.toString().toLowerCase() == 'npm') {
    packagerInstance = NPM;
  } else if (
    options.packager &&
    options.packager.toString().toLowerCase() == 'yarn'
  ) {
    packagerInstance = Yarn;
  } else if (packager('npm')) {
    packagerInstance = NPM;
  } else if (packager('yarn')) {
    packagerInstance = Yarn;
  } else {
    return {
      success: false,
      error: 'No Packager to process package.json, please install npm or yarn',
    };
  }
  logger.info(`packager instance is -- ${options.packager}`);
  let dependencyGraph = null;
  // Get the packager for the current process.
  const root = await getProjectRoot(context)
  options.root = join(context.root, root);
  let prodModules: string[] = await resolver.normalizeExternalDependencies(
        packageJson,
        workspacePackageJsonPath,
        options.verbose,
        stats,
        {},
        options.root,
        tsconfig
      );
      createPackageJson(prodModules, packageJsonPath, workspacePackageJsonPath);
      //got to generate lock entry for yarn for dependency graph to work.
      if (packagerInstance === Yarn) {
        logger.info(
          'generate lock entry for yarn for dependency graph to work.'
        );
        const result = await packagerInstance.generateLockFile(dirname(packageJsonPath));
        if (result.error) {
          logger.error('ERROR: generating lock file!');
          return { success: false, error: result.error.toString() };
        }
        // writeJsonFile(
        //   join(options.package, packagerInstance.lockfileName),
        //   result.stdout.toString()
        // );
      } else if (packagerInstance === NPM) {
        // need to install deps for dep-graph to work
        const result = await packagerInstance.install(dirname(packageJsonPath));
        if (result.error) {
          logger.error('ERROR: generating lock file!');
          return { success: false, error: result.error.toString() };
        }
      }
      // Get the packagelist with dependency graph and depth=2 level
      // review: Change depth to options?
      // review: Should I change everything to spawnsync for the pacakagers?
      logger.info(
        'get the packagelist with dependency graph and depth=2 level'
      );
      const getDependenciesResult = await packagerInstance.getProdDependencies(
        dirname(packageJsonPath),
        1,
        4
      );
      logger.info("getDependenciesResult")
      // logger.info(getDependenciesResult)
      if (!getDependenciesResult) {
        return {
          success: false,
          error: 'ERROR: getDependenciesResult!',
        };
      }
      const data = getDependenciesResult;
      if (packagerInstance === Yarn) {
        dependencyGraph = convertDependencyTrees(data)
      } else if (packagerInstance === NPM) {
        dependencyGraph = JSON.parse(data.toString());
      }
      const problems = _.get(dependencyGraph, 'problems', []);
      if (options.verbose && !_.isEmpty(problems)) {
        logger.info(`Ignoring ${_.size(problems)} NPM errors:`);
        _.forEach(problems, (problem) => {
          logger.info(`=> ${problem}`);
        });
      }
      // re-writing package.json with dependency-graphs
      logger.info('re-writing package.json with dependency-graphs');
      // logger.info(dependencyGraph)
      prodModules = await resolver.normalizeExternalDependencies(
        packageJson,
        workspacePackageJsonPath,
        options.verbose,
        stats,
        dependencyGraph,
        options.root,
        tsconfig
      );
      createPackageJson(prodModules, packageJsonPath, workspacePackageJsonPath);
      // run packager to  install node_modules
      logger.info('run packager to  install node_modules');
      const packageInstallResult = await packagerInstance.install(
        dirname(packageJsonPath),
        { ignoreScripts: options.ignoreScripts }
      );
      if (packageInstallResult.error) {
        logger.error('ERROR: install package error!');
        return {
          success: false,
          error: packageInstallResult.error.toString(),
        };
      }
      logger.info(packageInstallResult.stdout.toString());
      return { success: true };
}

function resolverFactory(
  resolverName: string,
  context: ExecutorContext
): DependencyResolver {
  // Dont know how to reflect class using type string???
  // const resolver = Object.create(window[resolverName].prototype);
  if (resolverName === 'WebpackDependencyResolver') {
    return new WebpackDependencyResolver(context);
  } else if (resolverName === 'DependencyCheckResolver') {
    return new DependencyCheckResolver(context);
  } else {
    throw `Resolver ${resolverName} does not exists`;
  }
}

function convertDependencyTrees(parsedTree) {
  const convertTrees = (trees) =>
    _.reduce(
      trees,
      (__, tree) => {
        const splitModule = _.split(tree.name, '@');
        // If we have a scoped module we have to re-add the @
        if (_.startsWith(tree.name, '@')) {
          splitModule.splice(0, 1);
          splitModule[0] = '@' + splitModule[0];
        }
        __[_.first(splitModule)] = {
          version: _.join(_.tail(splitModule), '@'),
          dependencies: convertTrees(tree.children),
        };
        return __;
      },
      {}
    );
  const trees = _.get(parsedTree, 'data.trees', []);
  const result = {
    problems: [],
    dependencies: convertTrees(trees),
  };
  return result;
}

function createPackageJson(
  externalModules,
  packageJsonPath,
  pathToPackageRoot
) {
  const compositePackage = _.defaults(
    {
      name: ServerlessWrapper.serverless.service.service,
      version: '1.0.0',
      description: `Packaged externals for ${ServerlessWrapper.serverless.service.service}`,
      private: true,
      scripts: {
        'package-yarn': 'yarn',
        'package-npm': 'npm install',
      },
    },
    {}
  );
  addModulesToPackageJson(externalModules, compositePackage, pathToPackageRoot); // for rebase , relPath
  writeJsonFile(packageJsonPath, compositePackage);
}

function addModulesToPackageJson(
  externalModules,
  packageJson,
  pathToPackageRoot
) {
  // , pathToPackageRoot
  _.forEach(externalModules, (externalModule) => {

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
  // logger.info(packageJson)
}

function rebaseFileReferences(pathToPackageRoot, moduleVersion) {
  if (/^(?:file:[^/]{2}|\.\/|\.\.\/)/.test(moduleVersion)) {
    const filePath = _.replace(moduleVersion, /^file:/, '');
    return _.replace(
      `${
        _.startsWith(moduleVersion, 'file:') ? 'file:' : ''
      }${pathToPackageRoot}/${filePath}`,
      /\\/g,
      '/'
    );
  }
  if (!moduleVersion || moduleVersion == '') {
    logger.info('setting moduleVersion to *')
    moduleVersion = '*';
  }
  return moduleVersion;
}
