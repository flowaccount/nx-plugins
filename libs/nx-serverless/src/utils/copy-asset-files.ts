import { copy, remove } from 'fs-extra';
import { BuildBuilderOptions, ServerlessDeployBuilderOptions, ServerlessSlsBuilderOptions, SimpleBuildEvent } from './types';
import { logger } from '@nrwl/devkit';

export default async function copyAssetFiles(
  options: BuildBuilderOptions
): Promise<SimpleBuildEvent> {
  logger.info('Copying asset files...');
  try {
    await Promise.all(
      options.assetFiles.map((file) => copy(file.input, file.output))
    );
    logger.info('Done copying asset files.');
    return {
      success: true,
    };
  } catch (err) {
    return {
      error: err.message,
      success: false,
    };
  }
}

export function copyAssetFilesSync(
  options: BuildBuilderOptions
): SimpleBuildEvent {
  logger.info('Copying asset files...');
  try {
    // options.assetFiles.map(file => copy(file.input, file.output))
    options.assetFiles.forEach((file) => {
      copy(file.input, file.output);
    });
    logger.info('Done copying asset files.');
    return {
      success: true,
    };
  } catch (err) {
    return {
      error: err.message,
      success: false,
    };
  }
}

export async function copyBuildOutputToBePackaged(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions
): Promise<SimpleBuildEvent> {
  logger.info(
    `Copying build output files from ${options.package} to ${options.serverlessPackagePath} to be packaged`
  );
  try {
    await remove(options.serverlessPackagePath); // remove old build output files (Support macOS issue)
    await copy(options.package, options.serverlessPackagePath);
    logger.info('Done copying build output files.');
    return {
      success: true,
    };
  } catch (err) {
    return {
      error: err.message,
      success: false,
    };
  }
}

const propKeys = [
  'buildTarget',
  'package',
  'list',
  'packager',
  'waitUntilTargets',
  'function',
  'ignoreScripts',
  'serverlessPackagePath',
  'root',
];

export function parseArgs(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions
) {
  const args = options.args;
  if (!args || args.length == 0) {
    const unknownOptionsTreatedAsArgs = Object.keys(options)
      .filter((p) => propKeys.indexOf(p) === -1)
      .reduce((m, c) => ((m[c] = options[c]), m), {});
    return unknownOptionsTreatedAsArgs;
  }

  return args
    .split(' ')
    .map((t) => t.trim())
    .reduce((m, c) => {
      if (!c.startsWith('--')) {
        throw new Error(`Invalid args: ${args}`);
      }
      const [key, value] = c.substring(2).split('=');
      if (!key || !value) {
        throw new Error(`Invalid args: ${args}`);
      }
      m[key] = value;
      return m;
    }, {});
}
