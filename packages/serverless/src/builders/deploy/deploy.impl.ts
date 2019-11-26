import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, bindCallback, of, zip, from, iif, observable } from 'rxjs';
import { concatMap, tap, mapTo, first, map, filter } from 'rxjs/operators';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';
import { ChildProcess, fork  } from 'child_process';
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

export interface ServerlessDeployBuilderOptions extends ServerlessOfflineOptions {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  host: string;
  port: number;
  watch: boolean;
  args: string[];
}

export default createBuilder<ServerlessDeployBuilderOptions & JsonObject>(serverlessExecutionHandler);
let subProcess: ChildProcess = null;

export function serverlessExecutionHandler(
  options: JsonObject & ServerlessDeployBuilderOptions,
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
}

async function runProcess(
  file: string,
  options: ServerlessDeployBuilderOptions
) {
  if (subProcess) {
    throw new Error('Already running');
  }
  subProcess = fork("node_modules\\serverless\\bin\\serverless.js", getExecArgv(options));
}
function startBuild(
  options: ServerlessDeployBuilderOptions,
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
        context.logger.info(stripIndents`
              ************************************************
              This is a custom wrapper of serverless deploy
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

function getExecArgv(options: ServerlessDeployBuilderOptions) {
  const args = [];
  args.push("deploy");
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) {
        args.push(`--${key}=${options[key]}`);
      }
    }
  }
  return args;
}

function restartProcess(
  file: string,
  options: ServerlessDeployBuilderOptions,
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
  options: ServerlessDeployBuilderOptions,
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