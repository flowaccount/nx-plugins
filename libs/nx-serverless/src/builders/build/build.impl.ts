import {
  BuildBuilderOptions,
  NormalizedBuildServerlessBuilderOptions,
  ServerlessEventResult,
} from '../../utils/types';
import { tap, map } from 'rxjs/operators';

import { getNodeWebpackConfig } from '../../utils/node.config';
import {
  normalizeBuildOptions,
  assignEntriesToFunctionsFromServerless,
  getSourceRoot,
} from '../../utils/normalize';
import { ServerlessWrapper } from '../../utils/serverless';
// import { wrapMiddlewareBuildOptions } from '../../utils/middleware';;
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { consolidateExcludes } from '../../utils/serverless.config';
import {
  copyAssetFilesSync,
} from '../../utils/copy-asset-files';
import normalizeAssetOptions from '../../utils/normalize-options';
import { convertNxExecutor, ExecutorContext, logger } from '@nrwl/devkit';

import { eachValueFrom } from 'rxjs-for-await';
import { runWebpack } from '../../utils/run-webpack';
// import { runWebpack } from '@nrwl/node/src/utils/

export type ServerlessBuildEvent =
  ServerlessEventResult & {
    outfile: string;
    success: boolean;
  };

export async function buildExecutor(
  options: BuildBuilderOptions,
  context: ExecutorContext
) {
  const root = getSourceRoot(context);
  options = normalizeBuildOptions(options, context.root, root);
  await ServerlessWrapper.init(options);
  options = assignEntriesToFunctionsFromServerless(options, context.root);
  options.tsConfig = consolidateExcludes(options);
  options.entry = options.files;
  const config = (<NormalizedBuildServerlessBuilderOptions>(
    options
  )).webpackConfig.reduce((currentConfig, plugin) => {
    return require(plugin)(currentConfig, {
      options,
      configuration: context.configurationName,
    });
  }, getNodeWebpackConfig(options));

  const resultCopy = copyAssetFilesSync(
    normalizeAssetOptions(options, context)
  );
  if (!resultCopy.success) {
    throw new Error(
      `Error building serverless application ${resultCopy.error}`
    );
  }

  logger.info('start compiling webpack');
  const iterator = eachValueFrom(
    runWebpack(config).pipe(
      tap((stats) => {
        console.info(stats.toString(config.stats));

        if (options.statsJson) {
          const statsJsonFile = resolve(
            context.root,
            options.outputPath,
            'stats.json'
          );
          writeFileSync(statsJsonFile, JSON.stringify(stats.toJson('verbose')));
        }
      }),
      map((stats) => {
        return {
          success: !stats.hasErrors(),
          outfile: resolve(context.root, options.outputPath),
          webpackStats: stats.toJson(config.stats),
          resolverName: 'WebpackDependencyResolver',
          tsconfig: options.tsConfig,
        } as ServerlessBuildEvent;
      })
    )
  );
  const event = <ServerlessBuildEvent>(await iterator.next()).value;
  return event;
}
export default buildExecutor;
export const serverlessBuilder = convertNxExecutor(buildExecutor);
