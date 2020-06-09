import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { runWebpack, BuildResult } from '@angular-devkit/build-webpack';
import { Observable, from, combineLatest, of } from 'rxjs';
// import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { BuildBuilderOptions, ServerlessEventResult } from '../../utils/types';
import { map, concatMap, switchMap, mergeMap } from 'rxjs/operators';

import { getNodeWebpackConfig } from '../../utils/node.config';
import {
  normalizeBuildOptions,
  assignEntriesToFunctionsFromServerless,
  getSourceRoot
} from '../../utils/normalize';
import { Stats } from 'webpack';
import { ServerlessWrapper } from '../../utils/serverless';
// import { wrapMiddlewareBuildOptions } from '../../utils/middleware';
import { resolve } from 'path';
import { WebpackDependencyResolver } from '../../utils/webpack.stats';
import { consolidateExcludes } from '../../utils/serverless.config';
export interface BuildServerlessBuilderOptions extends BuildBuilderOptions {}
export type ServerlessBuildEvent = BuildResult &
  ServerlessEventResult & {
    outfile: string;
  };

function run(
  options: JsonObject & BuildServerlessBuilderOptions,
  context: BuilderContext
): Observable<ServerlessBuildEvent> {
  return from(getSourceRoot(context)).pipe(
    map(sourceRoot =>
      normalizeBuildOptions(options, context.workspaceRoot, sourceRoot)
    ),
    switchMap(options =>
      combineLatest(of(options), from(ServerlessWrapper.init(options, context)))
    ),
    map(([options]) => {
      return assignEntriesToFunctionsFromServerless(
        options,
        context.workspaceRoot
      );
    }),
    map(options => {
      options.tsConfig = consolidateExcludes(options, context);
      options.entry = options.files;
      console.log(options.tsConfig);
      let config = getNodeWebpackConfig(options);
      if (options.webpackConfig) {
        config = require(options.webpackConfig)(config, {
          options,
          configuration: context.target.configuration
        });
      }
      return config;
    }),
    concatMap(config => {
      ServerlessWrapper.serverless.cli.log('start compiling webpack');
      return runWebpack(config, context, {
        logging: stats => {
          context.logger.info(stats.toString(config.stats));
        }
      });
    }),
    map((buildEvent: BuildResult) => {
      buildEvent.outfile = resolve(context.workspaceRoot, options.outputPath);
      buildEvent.resolverName = 'WebpackDependencyResolver';
      return buildEvent as ServerlessBuildEvent;
    })
  );
}
export default createBuilder<JsonObject & BuildServerlessBuilderOptions>(run);
