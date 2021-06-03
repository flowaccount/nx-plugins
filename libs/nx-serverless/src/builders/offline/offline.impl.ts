import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, bindCallback, of, zip, from } from 'rxjs';
import { concatMap, tap, mapTo, first, map, filter } from 'rxjs/operators';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';
import { ChildProcess, fork } from 'child_process';
import * as treeKill from 'tree-kill';
import { ServerlessBuildEvent } from '../build/build.impl';
import { runWaitUntilTargets } from '../../utils/target.schedulers';

try {
  require('dotenv').config();
} catch (e) {}

export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk'
}
// https://www.npmjs.com/package/serverless-offline
export interface ServerlessExecuteBuilderOptions extends JsonObject {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  watch: boolean;
  args: string[];
  verbose?: boolean;
  binPath?: string;
  host?: string;
  location?: string;
  noAuth?: boolean;
  noEnvironment?: boolean;
  port?: number;
  region?: string;
  printOutput?: boolean;
  preserveTrailingSlash?: boolean;
  stage?: string;
  useSeparateProcesses?: boolean;
  websocketPort?: number;
  prefix?: string;
  hideStackTraces?: boolean;
  corsAllowHeaders?: string;
  corsAllowOrigin?: string;
  corsDisallowCredentials?: string;
  corsExposedHeaders?: string;
  disableCookieValidation?: boolean;
  enforceSecureCookies?: boolean;
  exec?: string;
  readyWhen: string;
}

async function runProcess(
  file: string,
  options: ServerlessExecuteBuilderOptions
) {
  if (subProcess) {
    throw new Error('Already running');
  }
  subProcess = fork(
    'node_modules/serverless/bin/serverless.js',
    getExecArgv(options)
  );
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
        (scheduleTargetAndForget(context, target, {
          watch: true
        }) as unknown) as Observable<ServerlessBuildEvent>
    )
  );
}

function getExecArgv(options: ServerlessExecuteBuilderOptions) {
  const args = [];
  if (options.inspect === true) {
    options.inspect = InspectType.Inspect;
  }

  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`);
  }
  args.push('offline');
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) {
        args.push(`--${key}=${options[key]}`);
      }
    }
  }
  return args;
}

export default createBuilder<ServerlessExecuteBuilderOptions & JsonObject>(
  serverlessExecutionHandler
);
let subProcess: ChildProcess = null;

export function serverlessExecutionHandler(
  options: JsonObject & ServerlessExecuteBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
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
        return restartProcess(event.outfile, options, context).pipe(
          mapTo(event)
        );
      } else {
        context.logger.error('There was an error with the build. See above.');
        context.logger.info(`${event.outfile} was not restarted.`);
        return of(event);
      }
    })
  );
}
