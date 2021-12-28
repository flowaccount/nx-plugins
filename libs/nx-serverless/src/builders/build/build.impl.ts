import { JsonObject } from '@angular-devkit/core';
import { BuildResult } from '@angular-devkit/build-webpack';
// import { NodeJsSyncHost } from '@angular-devkit/core/node';
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
import { fstat, writeFileSync } from 'fs';
import { consolidateExcludes } from '../../utils/serverless.config';
import copyAssetFiles, {
  copyAssetFilesSync,
} from '../../utils/copy-asset-files';
import normalizeAssetOptions from '../../utils/normalize-options';
import { convertNxExecutor, ExecutorContext, logger } from '@nrwl/devkit';
import { runWebpack } from '@nrwl/workspace/src/utilities/run-webpack';
import * as webpack from 'webpack';

import { eachValueFrom } from 'rxjs-for-await';

export interface BuildServerlessBuilderOptions extends BuildBuilderOptions {}
export type ServerlessBuildEvent = BuildResult &
  ServerlessEventResult & {
    outfile: string;
    success: boolean;
  };

export async function buildExecutor(
  options: JsonObject & BuildServerlessBuilderOptions,
  context: ExecutorContext
) {
  const root = getSourceRoot(context);
  options = normalizeBuildOptions(options, context.root, root);
  await ServerlessWrapper.init(options, context);
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
  /*
      , {
        logging: stats => {
          logger.info(stats.toString(config.stats));
        }
      }*/
  const iterator = eachValueFrom(
    runWebpack(config, webpack).pipe(
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
