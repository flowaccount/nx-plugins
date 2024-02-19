import { ChildProcess, execSync, fork, spawn } from 'child_process';
import * as treeKill from 'tree-kill';
import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { ExecutorContext, logger } from '@nx/devkit';
import { promisify } from 'util';
import * as dotEnvJson from 'dotenv-json';
import {
  InspectType,
  ServerlessExecuteBuilderOptions,
  SimpleBuildEvent,
} from '../../utils/types';
import { getSlsCommand } from '../../utils/packagers';
import * as fs from 'fs';
import * as path from 'node:path';

try {
  require('dotenv').config();
} catch (e) {}

let subProcess: ChildProcess = null;
export async function* offlineExecutor(
  options: ServerlessExecuteBuilderOptions,
  context: ExecutorContext
) {
  console.log(options)
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
  // for await (const event of startBuild(options, context)) {
  //   if (!event.success) {
  //     logger.error('There was an error with the build. See above.');
  //     logger.info(`${event.outfile} was not restarted.`);
  //   }
  //   logger.info(`handleBuildEvent.`);
  //   await handleBuildEvent(event, options);
  //   yield event;
  // }

  await handleBuildEvent({ success: true}, options);
  yield ({ success: true});

  return new Promise<{ success: boolean }>(() => {
    success: true;
  });
}
async function handleBuildEvent(
  event: { success: boolean},
  options: ServerlessExecuteBuilderOptions
) {
  if ((!event.success || options.watch) && subProcess) {
    await killProcess();
  }
  logger.info('running process');
  runProcess(event, options);
}

function runProcess(
  event: SimpleBuildEvent,
  options: ServerlessExecuteBuilderOptions
) {

  if (subProcess || !event.success) {
    return;
  }
  dotEnvJson({
    path: `${options.package}/${options.processEnvFile ?? 'env-staging.json'}`
  });
  // options.config = `${process.cwd()}/dist/apps/api/lambda.crm/serverless.yml`
  const slsCommand = getSlsCommand();
  let stringifiedArgs = `offline --config ${options.config} --stage ${options.stage}`;
  const args: string[] = [];
  // args.push('sls');
  args.push('offline');
  // args.push('--help');
  // args.push(`--config=${options.config}`);
  args.push(`--stage=${options.stage}`);

  const configPath = path.parse(options.config)
  fs.copyFileSync(options.config, path.join(options.location, configPath.base))

  if(options.verbose) {
    stringifiedArgs += ' --verbose';
    args.push('--verbose');
  }
  const fullCommand = `${slsCommand} ${stringifiedArgs}`.trim();
  console.log(`Executing Command: ${fullCommand} in cwd: ${options.location} `); //${options.package}
    // subProcess = spawn(
    //   'npx',
    //   ['sls', ...args], {stdio: 'inherit', cwd: options.location}
    // )
    subProcess = fork(
      `${process.cwd()}/node_modules/serverless/bin/serverless.js`,   // require.resolve('serverless'),
      args,
      {
        stdio: 'inherit',
        cwd: options.location,
      }
    );
    subProcess.on('message', (message) => {
      console.log('Message from child process:', message);
    });
    subProcess.on('error', (err) => {
      console.log(err);
    });
    subProcess.once('exit', (code) => {
      if (code === 0) Promise.resolve({ success: true });
      // If process is killed due to current task being killed, then resolve with success.
      else Promise.resolve({ success: true });
    });
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
