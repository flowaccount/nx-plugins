import { Path, normalize } from '@angular-devkit/core';
import { resolve, dirname, relative, basename } from 'path';
import { BuildBuilderOptions } from './types';
import { statSync } from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as _ from 'lodash';
import { ServerlessWrapper } from './serverless';

export interface FileReplacement {
  replace: string;
  with: string;
}

export async function normalizeBuildOptions<T extends BuildBuilderOptions>(
  options: T,
  root: string,
  sourceRoot: string
): Promise<T> {
  ServerlessWrapper.serverless.cli.log("getting all functions")
  const functions = ServerlessWrapper.serverless.service.getAllFunctions()
  const entries = {};
  _.forEach(functions, (func, index) => {
    const entry = getEntryForFunction(functions[index], ServerlessWrapper.serverless.service.getFunction(func), ServerlessWrapper.serverless, sourceRoot, root);
    _.merge(entries, entry);
  });
  const result = {
    ...options,
    root: root,
    sourceRoot: sourceRoot,
    entry: entries,
    outputPath: resolve(root, options.outputPath),
    tsConfig: resolve(root, options.tsConfig),
    fileReplacements: normalizeFileReplacements(root, options.fileReplacements),
    assets: normalizeAssets(options.assets, root, sourceRoot),
    webpackConfig: options.webpackConfig
      ? resolve(root, options.webpackConfig)
      : options.webpackConfig
  };
  return result
}

const preferredExtensions = [
  '.js',
  '.ts',
  '.jsx',
  '.tsx'
];

const getEntryForFunction = (name, serverlessFunction, serverless, sourceroot, root) => {
  const handler = serverlessFunction.handler;

  const handlerFile = getHandlerFile(handler);
  if (!handlerFile) {
    _.get(this.serverless, 'service.provider.name') !== 'google' &&
      serverless.cli.log(`\nWARNING: Entry for ${name}@${handler} could not be retrieved.\nPlease check your service config if you want to use lib.entries.`);
    return {};
  }
  const ext = getEntryExtension(handlerFile, serverless);

  // Create a valid entry key
  const handlerFileFinal = handlerFile.replace('\src', '')
 
  return {
    [handlerFile]: resolve(root, `${sourceroot}${handlerFileFinal}${ext}`)
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
    nodir: true,
    // ignore: this.configuration.excludeFiles ? this.configuration.excludeFiles : undefined
  });

  if (_.isEmpty(files)) {
    // If we cannot find any handler we should terminate with an error
    throw new this.serverless.classes.Error(`No matching handler found for '${fileName}' in '${serverless.config.servicePath}'. Check your service definition.`);
  }

  // Move preferred file extensions to the beginning
  const sortedFiles = _.uniq(
    _.concat(
      _.sortBy(
        _.filter(files, file => _.includes(preferredExtensions, path.extname(file))),
        a => _.size(a)
      ),
      files
    )
  );

  if (_.size(sortedFiles) > 1) {
    this.serverless.cli.log(`WARNING: More than one matching handlers found for '${fileName}'. Using '${_.first(sortedFiles)}'.`);
  }
  return path.extname(_.first(sortedFiles));
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
