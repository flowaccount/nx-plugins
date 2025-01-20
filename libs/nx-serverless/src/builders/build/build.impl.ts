// import {
//   BuildBuilderOptions,
//   NormalizedBuildServerlessBuilderOptions,
//   ServerlessEventResult,
// } from '../../utils/types';
// import { tap, map, catchError } from 'rxjs/operators';
// import { getNodeWebpackConfig } from '../../utils/node.config';

// import { resolve } from 'path';
// import { writeFileSync } from 'fs';
// import { consolidateExcludes } from '../../utils/serverless.config';
// import { copyAssetFilesSync } from '../../utils/copy-asset-files';
// import normalizeAssetOptions from '../../utils/normalize-options';
// import { eachValueFrom } from 'rxjs-for-await';

import {
  convertNxExecutor,
  createProjectGraphAsync,
  ExecutorContext,
  logger,
} from '@nx/devkit'; //, runExecutor, Target
import { webpackExecutor } from '@nx/webpack';
import path = require('path');
import { ServerlessWrapper } from '../../utils/serverless';
import chalk from 'chalk';
import { assignEntriesToFunctionsFromServerless } from '../../utils/normalize';
import { ServerlessBuildBuilderOptions } from '../../utils/types';

export async function buildExecutor(
  options: ServerlessBuildBuilderOptions,
  context: ExecutorContext
) {
  const info = chalk.bold.green('info');
  const envFile: string = options.processEnvironmentFile ?? `env.json`;

  //const root = getSourceRoot(context);
  if (options.generatePackageJson) {
    logger.info(`${info} creating projectGraph`);
    context.projectGraph = await createProjectGraphAsync();
  }
  logger.info(`${info} initialing serverless configurations`);
  await ServerlessWrapper.init(context, envFile);
  const handlerEntries = assignEntriesToFunctionsFromServerless(context);
  options.main = handlerEntries.shift().entryPath;
  if (handlerEntries.length > 0) {
    options.additionalEntryPoints = handlerEntries;
  }
  const mainFileName = options.main
    .split('/')
    [options.main.split('/').length - 1].replace('.ts', '.js');
  console.log(options.main, mainFileName, options.additionalEntryPoints);
  console.log(options.outputPath);
  options.compiler = 'swc';
  options.outputFileName = mainFileName;
  options.target = 'node';
  options.runtimeChunk = false;
  options.commonChunk = false;
  options.outputHashing = 'none';
  options.progress = true;
  options.standardWebpackConfigFunction = false;
  options.webpackConfig = path.join(
    __dirname,
    '..',
    '..',
    'webpack/webpack.config.js'
  );
  logger.info(`${info} start compiling webpack`);
  const result = await webpackExecutor(options, context).next();
  return result.value;
}

export default buildExecutor;
export const serverlessBuilder = convertNxExecutor(buildExecutor);
