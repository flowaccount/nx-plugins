import { BuilderContext, createBuilder, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject, workspaces, resolve } from '@angular-devkit/core';
import { runWebpack, BuildResult } from '@angular-devkit/build-webpack';
import { Observable, from, observable } from 'rxjs';
// import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { BuildBuilderOptions, ServerlessOfflineOptions } from '../../utils/types';
import { map, concatMap, take, switchMap, mergeMap } from 'rxjs/operators';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { getNodeWebpackConfig } from '../../utils/node.config';
import { normalizeBuildOptions } from '../../utils/normalize';
import { Stats } from 'webpack';
import { ServerlessWrapper } from '../../utils/serverless';

export interface BuildServerlessBuilderOptions extends BuildBuilderOptions {

}
export type ServerlessBuildEvent = BuildResult & {
  outfile: string;
  stats: Stats;
};
export default createBuilder<JsonObject & BuildServerlessBuilderOptions>(run);

function run(
  options: JsonObject & BuildServerlessBuilderOptions,
  context: BuilderContext
): Observable<ServerlessBuildEvent> {

  return ServerlessWrapper.init(options, context)
  .pipe(mergeMap(() => from(getSourceRoot(context))),
        switchMap(sourceRoot =>
          from(normalizeBuildOptions(options, context.workspaceRoot, sourceRoot))
        ),
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

          ServerlessWrapper.serverless.cli.log("start compiling webpack")
          return runWebpack(config, context, {
            logging: stats => {
              context.logger.info(stats.toString(config.stats));
            }
          })
        }
        ),
        map((buildEvent: BuildResult) => {
          buildEvent.outfile = options.outputPath
          return buildEvent as ServerlessBuildEvent;
        })
      );
  }

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

