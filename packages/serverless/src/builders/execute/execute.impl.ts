import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget
} from '@angular-devkit/architect';
import { JsonObject, workspaces } from '@angular-devkit/core';
import { Observable, bindCallback, of, zip, from, iif, observable } from 'rxjs';
import { concatMap, tap, mapTo, first, map, filter } from 'rxjs/operators';
import { runWebpack, BuildResult } from '@angular-devkit/build-webpack';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';
import { exec, ChildProcess, fork  } from 'child_process';
import { TEN_MEGABYTES } from '@nrwl/workspace/src/command-line/shared';
import { ServerlessOfflineOptions } from '../../utils/types';
import * as treeKill from 'tree-kill';
import { ServerlessBuildEvent } from '../build/build.impl';
try {
  require('dotenv').config();
} catch (e) { }

export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk'
}

export interface ServerlessExecuteBuilderOptions extends ServerlessOfflineOptions {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  host: string;
  port: number;
  watch: boolean;
  args: string[];
}

export default createBuilder<ServerlessExecuteBuilderOptions & JsonObject>(serverlessExecutionHandler);
let subProcess: ChildProcess = null;

export function serverlessExecutionHandler(
  options: JsonObject & ServerlessExecuteBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {

  return runWaitUntilTargets(options, context).pipe(
    concatMap(v => {
      if (!v.success) {
        context.logger.error(
          `One of the tasks specified in waitUntilTargets failed`
        );
        return of({ success: false });
      }
  // build into output path before running serverless offline.
  return startBuild(options, context).pipe(
    concatMap((event: ServerlessBuildEvent) => {
      if (event.success) {
        return restartProcess(event.outfile, options, context).pipe(
          mapTo(event)
        );
      } else {
        context.logger.error(
          'There was an error with the build. See above.'
        );
        context.logger.info(`${event.outfile} was not restarted.`);
        return of(event);
      }
    }));
  }));
  //   concatMap((event: ServerlessBuildEvent) => {
  //     return new Observable<BuilderOutput>(observer => {
  //       try {
  //         context.logger.info("options sent in: " + options.location, options);
  //         from(runSerially(options, context)).pipe(
  //          map(success =>
  //           observer.next({ success })
  //          )
  //        )
  //       } catch (e) {
  //         observer.next({error:`ERROR: Something went wrong in @nx/serverless - ${e.message}`, success:false });
  //       }
  //     }) 
  //   }),
  // );
}

async function runProcess(
  file: string,
  options: ServerlessExecuteBuilderOptions
) {
  if (subProcess) {
    throw new Error('Already running');
  }
  let args: string[] = new Array<string>();
  args.push("offline");
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) {
        args.push(`--${key}=${options[key]}`);
      }
    }
  }
  subProcess = fork("node_modules\\serverless\\bin\\serverless.js", args);
}
function startBuild(
  options: ServerlessExecuteBuilderOptions,
  context: BuilderContext
): Observable<ServerlessBuildEvent> {
  const target = targetFromTargetString(options.buildTarget);
  return from(
    Promise.all([
      context.getTargetOptions(target),
      context.getBuilderNameForTarget(target)
    ]).then(([options, builderName]) =>
      context.validateOptions(options, builderName)
    )
  ).pipe(
    tap(options => {
      if (options.optimization) {
        context.logger.warn(stripIndents`
              ************************************************
              This is a simple process manager for use in
              testing or debugging Node applications locally.
              DO NOT USE IT FOR PRODUCTION!
              You should look into proper means of deploying
              your node application to production.
              ************************************************`);
      }
    }),
    concatMap(
      () =>
        scheduleTargetAndForget(context, target, {
          watch: true
        }) as Observable<ServerlessBuildEvent>
    )
  );
}

function getExecArgv(options: ServerlessExecuteBuilderOptions) {
  const args = ['-r', 'source-map-support/register'];

  if (options.inspect === true) {
    options.inspect = InspectType.Inspect;
  }

  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`);
  }

  return args;
}

function restartProcess(
  file: string,
  options: ServerlessExecuteBuilderOptions,
  context: BuilderContext
) {
  return killProcess(context).pipe(
    tap(() => {
      runProcess(file, options);
    })
  );
}

function killProcess(context: BuilderContext): Observable<void | Error> {
  if (!subProcess) {
    return of(undefined);
  }

  const observableTreeKill = bindCallback<number, string, Error>(treeKill);
  return observableTreeKill(subProcess.pid, 'SIGTERM').pipe(
    tap(err => {
      subProcess = null;
      if (err) {
        if (Array.isArray(err) && err[0] && err[2]) {
          const errorMessage = err[2];
          context.logger.error(errorMessage);
        } else if (err.message) {
          context.logger.error(err.message);
        }
      }
    })
  );
}

function runWaitUntilTargets(
  options: ServerlessExecuteBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  if (!options.waitUntilTargets || options.waitUntilTargets.length === 0)
    return of({ success: true });

  return zip(
    ...options.waitUntilTargets.map(b => {
      return scheduleTargetAndForget(context, targetFromTargetString(b)).pipe(
        filter(e => e.success !== undefined),
        first()
      );
    })
  ).pipe(
    map(results => {
      return { success: !results.some(r => !r.success) };
    })
  );
}