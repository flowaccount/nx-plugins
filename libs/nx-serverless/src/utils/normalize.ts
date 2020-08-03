import { normalize, workspaces } from '@angular-devkit/core';
import { BuilderContext } from '@angular-devkit/architect';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { resolve, dirname, relative, basename } from 'path';
import { ServerlessBaseOptions } from './types';
import { statSync } from 'fs';
import * as glob from 'glob';
import { extname, join } from 'path';
import * as _ from 'lodash';
import { ServerlessWrapper } from './serverless';

export interface FileReplacement {
  replace: string;
  with: string;
}

export function assignEntriesToFunctionsFromServerless<
  T extends ServerlessBaseOptions
>(options: T, root: string): T {
  ServerlessWrapper.serverless.cli.log('getting all functions');
  const functions = ServerlessWrapper.serverless.service.getAllFunctions();
  const entries = {};
  _.forEach(functions, (func, index) => {
    normalize;
    const entry = getEntryForFunction(
      functions[index],
      ServerlessWrapper.serverless.service.getFunction(func),
      ServerlessWrapper.serverless,
      options.sourceRoot,
      root
    );
    _.merge(entries, entry);
  });
  const result = {
    ...options,
    files: entries
  };
  return result;
}

export async function getProjectRoot(context: BuilderContext) {
  const workspaceHost = workspaces.createWorkspaceHost(new NodeJsSyncHost());
  const { workspace } = await workspaces.readWorkspace(
    context.workspaceRoot,
    workspaceHost
  );
  if (workspace.projects.get(context.target.project).root) {
    return workspace.projects.get(context.target.project).root;
  } else {
    context.reportStatus('Error');
    const message = `${context.target.project} does not have a root. Please define one.`;
    context.logger.error(message);
    throw new Error(message);
  }
}

export async function getSourceRoot(context: BuilderContext) {
  const workspaceHost = workspaces.createWorkspaceHost(new NodeJsSyncHost());
  const { workspace } = await workspaces.readWorkspace(
    context.workspaceRoot,
    workspaceHost
  );
  if (workspace.projects.get(context.target.project).sourceRoot) {
    return workspace.projects.get(context.target.project).sourceRoot;
  } else {
    context.reportStatus('Error');
    const message = `${context.target.project} does not have a sourceRoot. Please define one.`;
    context.logger.error(message);
    throw new Error(message);
  }
}

export function normalizeBuildOptions<T extends ServerlessBaseOptions>(
  options: T,
  root: string,
  sourceRoot: string
): T {
  const result = {
    ...options,
    root: root,
    sourceRoot: sourceRoot,
    package: resolve(root, options.package),
    serverlessConfig: resolve(root, options.serverlessConfig),
    servicePath: resolve(root, options.servicePath),
    outputPath: resolve(root, options.outputPath),
    tsConfig: resolve(root, options.tsConfig),
    fileReplacements: normalizeFileReplacements(root, options.fileReplacements),
    assets: normalizeAssets(options.assets, root, sourceRoot),
    webpackConfig: options.webpackConfig
      ? resolve(root, options.webpackConfig)
      : options.webpackConfig
  };
  return result;
}

const preferredExtensions = ['.js', '.ts', '.jsx', '.tsx'];

export const getEntryForFunction = (
  name,
  serverlessFunction,
  serverless,
  sourceroot,
  root
) => {
  const handler = serverlessFunction.handler;

  const handlerFile = getHandlerFile(handler);
  if (!handlerFile) {
    _.get(serverless, 'service.provider.name') !== 'google' &&
      serverless.cli.log(
        `\nWARNING: Entry for ${name}@${handler} could not be retrieved.\nPlease check your service config if you want to use lib.entries.`
      );
    return {};
  }
  const ext = getEntryExtension(handlerFile, serverless);

  // Create a valid entry key
  let handlerFileFinal = `${sourceroot.replace(
    '/src',
    ''
  )}/${handlerFile}${ext}`;

  if (handlerFile.match(/src/)) {
    handlerFileFinal = `${sourceroot}/${handlerFile.replace('src/', '')}${ext}`;
  }

  return {
    [handlerFile]: resolve(root, `${handlerFileFinal}`)
  };
};

const getHandlerFile = handler => {
  // Check if handler is a well-formed path based handler.
  const handlerEntry = /(.*)\..*?$/.exec(handler);
  if (handlerEntry) {
    return handlerEntry[1];
  }
};

const getEntryExtension = (fileName, serverless) => {
  const files = glob.sync(`${fileName}.*`, {
    cwd: serverless.config.servicePath,
    nodir: true
    // ignore: this.configuration.excludeFiles ? this.configuration.excludeFiles : undefined
  });

  if (_.isEmpty(files)) {
    // If we cannot find any handler we should terminate with an error
    throw new serverless.classes.Error(
      `No matching handler found for '${fileName}' in '${serverless.config.servicePath}'. Check your service definition.`
    );
  }

  // Move preferred file extensions to the beginning
  const sortedFiles = _.uniq(
    _.concat(
      _.sortBy(
        _.filter(files, file => _.includes(preferredExtensions, extname(file))),
        a => _.size(a)
      ),
      files
    )
  );

  if (_.size(sortedFiles) > 1) {
    serverless.cli.log(
      `WARNING: More than one matching handlers found for '${fileName}'. Using '${_.first(
        sortedFiles
      )}'.`
    );
  }
  return extname(_.first(sortedFiles));
};

function normalizeAssets(
  assets: any[],
  root: string,
  sourceRoot: string
): any[] {
  return assets.map(asset => {
    if (typeof asset === 'string') {
      const assetPath = normalize(asset);
      const resolvedAssetPath = resolve(root, assetPath);
      const resolvedSourceRoot = resolve(root, sourceRoot);

      if (!resolvedAssetPath.startsWith(resolvedSourceRoot)) {
        throw new Error(
          `The ${resolvedAssetPath} asset path must start with the project source root: ${sourceRoot}`
        );
      }

      const isDirectory = statSync(resolvedAssetPath).isDirectory();
      const input = isDirectory
        ? resolvedAssetPath
        : dirname(resolvedAssetPath);
      const output = relative(resolvedSourceRoot, resolve(root, input));
      const glob = isDirectory ? '**/*' : basename(resolvedAssetPath);
      return {
        input,
        output,
        glob
      };
    } else {
      if (asset.output.startsWith('..')) {
        throw new Error(
          'An asset cannot be written to a location outside of the output path.'
        );
      }

      const assetPath = normalize(asset.input);
      const resolvedAssetPath = resolve(root, assetPath);
      return {
        ...asset,
        input: resolvedAssetPath,
        // Now we remove starting slash to make Webpack place it from the output root.
        output: asset.output.replace(/^\//, '')
      };
    }
  });
}

function normalizeFileReplacements(
  root: string,
  fileReplacements: FileReplacement[]
): FileReplacement[] {
  return fileReplacements.map(fileReplacement => ({
    replace: resolve(root, fileReplacement.replace),
    with: resolve(root, fileReplacement.with)
  }));
}

export function getProdModules(
  externalModules,
  packageJson,
  packagePath,
  forceExcludes,
  dependencyGraph,
  verbose = false
): string[] {
  const prodModules = [];
  // only process the module stated in dependencies section
  if (!packageJson.dependencies) {
    return [];
  }
  const ignoredDevDependencies = [
    'aws-sdk',
    '@types/aws-serverless-express',
    '@types/aws-lambda',
    '@types/node'
  ];
  // Get versions of all transient modules
  _.forEach(externalModules, module => {
    let moduleVersion = packageJson.dependencies[module.external];
    if (moduleVersion) {
      prodModules.push(`${module.external}@${moduleVersion}`);
      // Check if the module has any peer dependencies and include them too
      try {
        const modulePackagePath = join(
          dirname(packagePath),
          'node_modules',
          module.external,
          'package.json'
        );
        const peerDependencies = require(modulePackagePath).peerDependencies;
        if (!_.isEmpty(peerDependencies)) {
          verbose &&
            ServerlessWrapper.serverless.cli.log(
              `Adding explicit peers for dependency ${module.external}`
            );
          const peerModules = this.getProdModules.call(
            this,
            _.map(peerDependencies, (value, key) => ({ external: key })),
            packageJson,
            packagePath,
            forceExcludes,
            dependencyGraph
          );
          Array.prototype.push.apply(prodModules, peerModules);
        }
      } catch (e) {
        ServerlessWrapper.serverless.cli.log(
          `WARNING: Could not check for peer dependencies of ${module.external}`
        );
      }
    } else {
      if (
        !packageJson.devDependencies ||
        (!packageJson.devDependencies[module.external] &&
          dependencyGraph.dependencies)
      ) {
        if (_.includes(ignoredDevDependencies, module.external)) {
          ServerlessWrapper.serverless.cli.log(
            `INFO: Skipping addition of ${module.external} which is supposed to be devDependencies`
          );
        } else {
          // Add transient dependencies if they appear not in the service's dev dependencies
          const originInfo =
            _.get(dependencyGraph, 'dependencies', {})[module.external] || {};
          moduleVersion = _.get(originInfo, 'version', null);
          if (!moduleVersion) {
            ServerlessWrapper.serverless.cli.log(
              `WARNING: Could not determine version of module ${module.external}`
            );
          }
          prodModules.push(
            moduleVersion
              ? `${module.external}@${moduleVersion}`
              : module.external
          );
        }
      } else if (
        packageJson.devDependencies &&
        packageJson.devDependencies[module.external] &&
        !_.includes(forceExcludes, module.external)
      ) {
        // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
        // most likely set in devDependencies and should not lead to an error now.

        if (!_.includes(ignoredDevDependencies, module.external)) {
          // Runtime dependency found in devDependencies but not forcefully excluded
          ServerlessWrapper.serverless.cli.log(
            `ERROR: Runtime dependency '${module.external}' found in devDependencies. Move it to dependencies or use forceExclude to explicitly exclude it.`
          );
          throw new ServerlessWrapper.serverless.classes.Error(
            `Serverless-webpack dependency error: ${module.external}.`
          );
        }
        verbose &&
          ServerlessWrapper.serverless.cli.log(
            `INFO: Runtime dependency '${module.external}' found in devDependencies. It has been excluded automatically.`
          );
      }
    }
  });
  return prodModules;
}
