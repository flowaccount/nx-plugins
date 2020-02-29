import { BuilderContext, createBuilder } from '@angular-devkit/architect';
import { JsonObject, workspaces } from '@angular-devkit/core';
import { runWebpack, BuildResult } from '@angular-devkit/build-webpack';
import { Observable, from, combineLatest, of } from 'rxjs';
// import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { BuildBuilderOptions } from '../../utils/types';
import { map, concatMap, switchMap } from 'rxjs/operators';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { getNodeWebpackConfig } from '../../utils/node.config';
import { normalizeBuildOptions, assignEntriesToFunctionsFromServerless } from '../../utils/normalize';
import { Stats } from 'webpack';
import { ServerlessWrapper } from '../../utils/serverless';
// import { wrapMiddlewareBuildOptions } from '../../utils/middleware';
import { resolve } from 'path';
export interface BuildServerlessBuilderOptions extends BuildBuilderOptions {

}
export type ServerlessBuildEvent = BuildResult & {
  outfile: string;
  stats: Stats;
};

async function getSourceRoot(context: BuilderContext) {
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

function run(
  options: JsonObject & BuildServerlessBuilderOptions,
  context: BuilderContext
): Observable<ServerlessBuildEvent> {

  return from(getSourceRoot(context))
    .pipe(
      map(sourceRoot =>
        normalizeBuildOptions(options, context.workspaceRoot, sourceRoot)
      ),
      switchMap((options) => combineLatest(of(options), from(ServerlessWrapper.init(options, context)))),
      map(([options, empty]) => { return assignEntriesToFunctionsFromServerless(options, context.workspaceRoot) }),
      map(options => {
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
        ServerlessWrapper.serverless.cli.log('start compiling webpack')
        return runWebpack(config, context, {
          logging: stats => {
            context.logger.info(stats.toString(config.stats));
          }
        })
      }
      ),
      map((buildEvent: BuildResult) => {
        buildEvent.outfile = resolve(context.workspaceRoot, options.outputPath)
        return buildEvent as ServerlessBuildEvent;
      })
    );
}

export default createBuilder<JsonObject & BuildServerlessBuilderOptions>(run);


