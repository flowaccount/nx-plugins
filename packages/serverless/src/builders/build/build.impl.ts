import { BuilderContext, createBuilder, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject, workspaces, resolve } from '@angular-devkit/core';
import { runWebpack, BuildResult } from '@angular-devkit/build-webpack';
import { Observable, from, observable } from 'rxjs';
// import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { BuildBuilderOptions, ServerlessOfflineOptions } from '../../utils/types';
import { map, concatMap, take, switchMap } from 'rxjs/operators';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { getNodeWebpackConfig } from '../../utils/node.config';
import { normalizeBuildOptions } from '../../utils/normalize';
import { Stats } from 'webpack';
import * as isBuiltinModule from 'is-builtin-module';
import * as _ from 'lodash';
import * as fs from 'fs';
export interface BuildServerlessBuilderOptions extends BuildBuilderOptions {
   
}
export type ServerlessBuildEvent = BuildResult & {
  outfile: string;
};
export default createBuilder<JsonObject & BuildServerlessBuilderOptions>(run);

function run(
  options: JsonObject & BuildServerlessBuilderOptions,
  context: BuilderContext
): Observable<ServerlessBuildEvent> {
  return from(getSourceRoot(context)).pipe(
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
    concatMap(config =>
      runWebpack(config, context, {
        logging: stats => {
          // fs.writeFile('stat.json',  JSON.stringify(stats.toJson()),  function(err) {
          //   if (err) {
          //       return console.error(err);
          //   }
          //   console.log("File created!");
          // });
          context.logger.info(stats.toString(config.stats));
        }
      })
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

function getExternalModules(stats: Stats) {
  if (!stats.compilation.chunks) {
    return [];
  }
  const externals = new Set();
  for (const chunk of stats.compilation.chunks) {
    if (!chunk.modulesIterable) {
      continue;
    }

    // Explore each module within the chunk (built inputs):
    for (const module of chunk.modulesIterable) {
      if (isExternalModule(module)) {
        externals.add({
          origin: _.get(findExternalOrigin(module.issuer), 'rawRequest'),
          external: getExternalModuleName(module)
        });
      }
    }
  }
  return Array.from(externals);
}

function getExternalModuleName(module) {
  const path = /^external "(.*)"$/.exec(module.identifier())[1];
  const pathComponents = path.split('/');
  const main = pathComponents[0];

  // this is a package within a namespace
  if (main.charAt(0) == '@') {
    return `${main}/${pathComponents[1]}`;
  }

  return main;
}

function isExternalModule(module) {
  return _.startsWith(module.identifier(), 'external ') && !isBuiltinModule(getExternalModuleName(module));
}

/**
 * Find the original module that required the transient dependency. Returns
 * undefined if the module is a first level dependency.
 * @param {Object} issuer - Module issuer
 */
function findExternalOrigin(issuer) {
  if (!_.isNil(issuer) && _.startsWith(issuer.rawRequest, './')) {
    return findExternalOrigin(issuer.issuer);
  }
  return issuer;
}