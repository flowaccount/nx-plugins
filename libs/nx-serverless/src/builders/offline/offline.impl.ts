import { BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { ChildProcess, execSync, fork } from 'child_process';
import * as treeKill from 'tree-kill';
import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { ExecutorContext, logger } from '@nrwl/devkit';
import { promisify } from 'util';

try {
  require('dotenv').config();
} catch (e) {}

export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk',
}
// https://www.npmjs.com/package/serverless-offline
export interface ServerlessExecuteBuilderOptions extends JsonObject {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  watch: boolean;
  args: string[];
  runtimeArgs: string[];
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

let subProcess: ChildProcess = null;

export async function* offlineExecutor(
  options: JsonObject & ServerlessExecuteBuilderOptions,
  context: ExecutorContext
) {
  process.on('SIGTERM', () => {
    subProcess?.kill();
    process.exit(128 + 15);
  });
  process.on('exit', (code) => {
    process.exit(code);
  });
  if (options.skipBuild) {
    if (options.waitUntilTargets && options.waitUntilTargets.length > 0) {
      const results = await runWaitUntilTargets(
        options.waitUntilTargets,
        context
      );
      for (const [i, result] of results.entries()) {
        if (!result.success) {
          console.log('throw');
          throw new Error(
            `Wait until target failed: ${options.waitUntilTargets[i]}.`
          );
        }
      }
    }
  }
  options.watch = true;
  for await (const event of startBuild(options, context)) {
    if (!event.success) {
      logger.error('There was an error with the build. See above.');
      logger.info(`${event.outfile} was not restarted.`);
    }
    logger.info(`handleBuildEvent.`);
    await handleBuildEvent(event, options);
    yield event;
  }
  return new Promise<{ success: boolean }>(() => {
    success: true;
  });
}
async function handleBuildEvent(
  event: BuilderOutput,
  options: ServerlessExecuteBuilderOptions
) {
  if ((!event.success || options.watch) && subProcess) {
    await killProcess();
  }
  logger.info('running process');
  runProcess(event, options);
}

function runProcess(
  event: BuilderOutput,
  options: ServerlessExecuteBuilderOptions
) {
  if (subProcess || !event.success) {
    return;
  }
  subProcess = fork(
    'node_modules/serverless/bin/serverless.js',
    getExecArgv(options)
  );
}

async function killProcess() {
  if (!subProcess) {
    return;
  }

  const promisifiedTreeKill: (pid: number, signal: string) => Promise<void> =
    promisify(treeKill);
  try {
    await promisifiedTreeKill(subProcess.pid, 'SIGTERM');
  } catch (err) {
    if (Array.isArray(err) && err[0] && err[2]) {
      const errorMessage = err[2];
      logger.error(errorMessage);
    } else if (err.message) {
      logger.error(err.message);
    }
  } finally {
    subProcess = null;
  }
}

function getServerlessArg(options: ServerlessExecuteBuilderOptions) {
  const args = ['offline', ...options.args];
  if (options.inspect === true) {
    options.inspect = InspectType.Inspect;
  }
  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`);
  }
  return args;
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

export default offlineExecutor;
