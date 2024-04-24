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

import { convertNxExecutor, createProjectGraphAsync, ExecutorContext, logger } from '@nx/devkit'; //, runExecutor, Target
import { WebpackExecutorOptions, webpackExecutor } from '@nx/webpack';
import path = require('path');
import { ServerlessWrapper } from '../../utils/serverless';
import * as chalk from 'chalk';
import {
  assignEntriesToFunctionsFromServerless,
  // normalizeBuildOptions,
  getSourceRoot,
} from '../../utils/normalize';

// export type ServerlessBuildEvent = ServerlessEventResult & {
//   outfile: string;
//   success: boolean;
// };

// export async function buildExecutor(
//   options: BuildBuilderOptions,
//   context: ExecutorContext
// ) {
//   const root = getSourceRoot(context);
//   options = normalizeBuildOptions(options, context.root, root);
//   await ServerlessWrapper.init(options);
//   options = assignEntriesToFunctionsFromServerless(options, context.root);
//   options.tsConfig = consolidateExcludes(options);
//   options.entry = options.files;
//   const config = (<NormalizedBuildServerlessBuilderOptions>(
//     options
//   )).webpackConfig.reduce((currentConfig, plugin) => {
//     return require(plugin)(currentConfig, {
//       options,
//       configuration: context.configurationName,
//     });
//   }, getNodeWebpackConfig(options));

//   const resultCopy = copyAssetFilesSync(
//     normalizeAssetOptions(options, context)
//   );
//   if (!resultCopy.success) {
//     throw new Error(
//       `Error building serverless application ${resultCopy.error}`
//     );
//   }
//   logger.info('finished copying assets');
//   logger.info('start compiling webpack');
//   const iterator = eachValueFrom(
//     runWebpack(config).pipe(
//       tap((stats) => {
//         // console.info(stats.toString(config.stats));
//         if (options.statsJson) {
//           const statsJsonFile = resolve(
//             context.root,
//             options.outputPath,
//             'stats.json'
//           );
//           writeFileSync(statsJsonFile, JSON.stringify(stats.toJson('verbose')));
//         }
//       }),
//       map((stats) => {
//         return {
//           success: !stats.hasErrors(),
//           outfile: resolve(context.root, options.outputPath),
//           webpackStats: stats.toJson(config.stats),
//           resolverName: 'WebpackDependencyResolver',
//           tsconfig: options.tsConfig,
//         } as ServerlessBuildEvent;
//       }),
//       catchError((e, caught) => {
//         logger.error(e);
//         logger.error(caught);
//         return of({ success: false } as ServerlessBuildEvent);
//       })
//     )
//   );
//   const event = <ServerlessBuildEvent>(await iterator.next()).value;
//   return event;
// }


export async function buildExecutor(
  options: WebpackExecutorOptions,
  context: ExecutorContext
) {
  const info = chalk.bold.green('info')
  //const root = getSourceRoot(context);
  if(options.generatePackageJson) {
    logger.info(`${info} creating projectGraph`)
    context.projectGraph = await createProjectGraphAsync();
  }
  logger.info(`${info} initialing serverless configurations`)
  await ServerlessWrapper.init(context, 'env.json');
  const handlerEntries = assignEntriesToFunctionsFromServerless(context);
  options.main = handlerEntries.shift().entryPath;
  if(handlerEntries.length > 0) {
    options.additionalEntryPoints = handlerEntries;
  }
  const mainFileName =  options.main.split('/')[options.main.split('/').length - 1].replace('.ts', '.js');
  console.log(options.main , mainFileName,  options.additionalEntryPoints );
  console.log(options.outputPath)
  options.compiler = 'swc'; 
  options.outputFileName = mainFileName;
  options.target = 'node';
  options.runtimeChunk = false;
  options.commonChunk = false;
  options.outputHashing = 'none';
  options.progress = true;
  options.standardWebpackConfigFunction = false
  options.webpackConfig = path.join(__dirname, '..', '..', 'webpack/webpack.config.js');
  logger.info(`${info} start compiling webpack`);
  const result = await webpackExecutor(options,context).next();
  return result.value;
}

export default buildExecutor;
export const serverlessBuilder = convertNxExecutor(buildExecutor);

