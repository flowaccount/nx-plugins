import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { copy } from 'fs-extra';
import { ServerlessSlsBuilderOptions } from '../builders/sls/sls.impl';
import { ServerlessDeployBuilderOptions } from '../builders/deploy/deploy.impl';
import { BuildBuilderOptions, ServerlessBaseOptions } from './types';

export default function copyAssetFiles(
  options: BuildBuilderOptions,
  context: BuilderContext
): Promise<BuilderOutput> {
  context.logger.info('Copying asset files...');
  return Promise.all(
    options.assetFiles.map((file) => copy(file.input, file.output))
  )
    .then(() => {
      context.logger.info('Done copying asset files.');
      return {
        success: true,
      };
    })
    .catch((err: Error) => {
      return {
        error: err.message,
        success: false,
      };
    });
}

export function copyBuildOutputToBePackaged(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions,
  context: BuilderContext
): Promise<BuilderOutput> {
  context.logger.info(`Copying build output files from ${options.package} to ${options.serverlessPackagePath} to be packaged`);
  return copy(options.package, options.serverlessPackagePath)
    .then(() => {
      context.logger.info('Done copying build output files.');
      return {
        success: true,
      };
    })
    .catch((err: Error) => {
      return {
        error: err.message,
        success: false,
      };
    });
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

export function parseArgs(options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions) {
  const args = options.args;
  if (!args) {
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