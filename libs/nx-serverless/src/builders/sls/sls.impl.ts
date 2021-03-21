import {
  BuilderContext,
  createBuilder,
  BuilderOutput
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { ServerlessBuildEvent } from '../build/build.impl';
import * as _ from 'lodash';
import { getExecArgv, ServerlessWrapper } from '../../utils/serverless';
/* Fix for EMFILE: too many open files on serverless deploy */
import * as fs from 'fs';
import * as gracefulFs from 'graceful-fs';
import { preparePackageJson } from '../../utils/packagers';
import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { Packager } from '../../utils/enums';
import {
  copyBuildOutputToBePackaged,
  parseArgs
} from '../../utils/copy-asset-files';
gracefulFs.gracefulify(fs);
/* Fix for EMFILE: too many open files on serverless deploy */
export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk'
}

// review: Have to spin off options and clarify schema.json for deploy,build,serve
export interface ServerlessSlsBuilderOptions extends JsonObject {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  host: string;
  port: number;
  watch: boolean;
  package: string;
  location: string;
  stage: string;
  verbose?: boolean;
  sourceRoot?: string;
  root?: string;
  command: string;
  ignoreScripts: boolean;
  packager?: Packager;
  serverlessPackagePath?: string;
  args?: string;
}

export default createBuilder<ServerlessSlsBuilderOptions & JsonObject>(
  serverlessExecutionHandler
);
export function serverlessExecutionHandler(
  options: JsonObject & ServerlessSlsBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  // build into output path before running serverless offline.
  let packagePath = options.location;
  return runWaitUntilTargets(options.waitUntilTargets, context).pipe(
    concatMap(v => {
      if (!v.success) {
        context.logger.error(
          'One of the tasks specified in waitUntilTargets failed'
        );
        return of({ success: false });
      }
      return startBuild(options, context);
    }),
    concatMap((event: ServerlessBuildEvent) => {
      if (event.success) {
        return preparePackageJson(
          options,
          context,
          event.webpackStats,
          event.resolverName,
          event.tsconfig
        );
      } else {
        context.logger.error('There was an error with the build. See above.');
        context.logger.info(`${event.outfile} was not restarted.`);
        return of({
          success: false,
          error: `${event.outfile} was not restarted.`
        });
      }
    }),
    concatMap(result => {
      if (result.success) {
        if (
          !options.serverlessPackagePath &&
          options.location.indexOf('dist/') > -1
        ) {
          packagePath = options.location.replace(
            'dist/',
            'dist/.serverlessPackages/'
          );
        } else if (options.serverlessPackagePath) {
          packagePath = options.serverlessPackagePath;
        }
        options.serverlessPackagePath = packagePath;
        return copyBuildOutputToBePackaged(options, context);
      } else {
        context.logger.error(
          `There was an error with the build. ${result.error}.`
        );
        return of(result);
      }
    }),
    concatMap(result => {
      if (result.success) {
        // change servicePath to distribution location
        // review: Change options from location to outputpath?\
        const servicePath = ServerlessWrapper.serverless.config.servicePath;
        const args = getExecArgv(options);
        let packagePath = options.location;
        if (
          !options.serverlessPackagePath &&
          options.location.indexOf('dist/') > -1
        ) {
          packagePath = options.location.replace('dist/', 'dist/.serverless/');
        } else if (options.serverlessPackagePath) {
          packagePath = options.serverlessPackagePath;
        }

        ServerlessWrapper.serverless.config.servicePath = packagePath;
        ServerlessWrapper.serverless.processedInput = {
          commands: [options.command],
          options: args
        };
        return new Observable<BuilderOutput>(option => {
          ServerlessWrapper.serverless
            .run()
            .then(() => {
              // change servicePath back for further processing.
              ServerlessWrapper.serverless.config.servicePath = servicePath;
              option.next({ success: true });
              option.complete();
            })
            .catch(ex => {
              option.next({ success: false, error: ex.toString() });
              option.complete();
            });
        }).pipe(
          concatMap(result => {
            return of(result);
          })
        );
      } else {
        context.logger.error(
          `There was an error with the build. ${result.error}.`
        );
        return of(result);
      }
    })
  );
}
