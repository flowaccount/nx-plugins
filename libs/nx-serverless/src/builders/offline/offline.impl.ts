import { ChildProcess, spawn } from 'child_process';
import treeKill from 'tree-kill';
import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { ExecutorContext, logger } from '@nx/devkit';
import { promisify } from 'util';
import dotEnvJson from 'dotenv-json';
import {
  InspectType,
  ServerlessExecutorOptions,
  SimpleBuildEvent,
} from '../../utils/types';
import { getSlsCommand } from '../../utils/packagers';
import * as path from 'node:path';
import chalk from 'chalk';
import { getProjectRoot } from '../../utils/normalize';
import { NX_SERVERLESS_BUILD_TARGET_KEY } from '../../nrwl/nx-facade';
import * as dotfile from 'dotenv';

try {
  dotfile.config();
} catch (e) {
  /* empty */
}

let subProcess: ChildProcess = null;

export async function* offlineExecutor(
  options: ServerlessExecutorOptions,
  context: ExecutorContext
) {
  const info = chalk.bold.green('info');
  process.on('SIGTERM', () => {
    subProcess?.kill();
    process.exit(128 + 15);
  });
  process.on('exit', (code) => {
    process.exit(code);
  });
  options.stage = options.stage ?? 'dev';
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
    logger.info(
      `${info} finished building, kill old and starting offline process.`
    );
    await handleBuildEvent(event, options, context);
    yield event;
  }

  await handleBuildEvent({ success: true }, options, context);
  yield { success: true };

  return new Promise<{ success: boolean }>(() => {
    true;
  });
}
async function handleBuildEvent(
  event: { success: boolean },
  options: ServerlessExecutorOptions,
  context: ExecutorContext
) {
  if ((!event.success || options.watch) && subProcess) {
    await killProcess();
  }
  logger.info(`${chalk.bold.green('info')} running process`);
  runProcess(event, options, context);
}

function runProcess(
  event: SimpleBuildEvent,
  options: ServerlessExecutorOptions,
  context: ExecutorContext
) {
  if (subProcess || !event.success) {
    return;
  }

  const projectRoot = getProjectRoot(context);

  dotEnvJson({
    path: `${projectRoot}/${options.processEnvironmentFile ?? 'env.json'}`,
  });

  const slsCommand = getSlsCommand();
  let stringifiedArgs = `offline --stage ${options.stage}`;
  const args: string[] = [];
  args.push('offline');
  args.push(`--stage=${options.stage}`);

  // const configPath = path.parse(options.config)
  // fs.copyFileSync(options.config, path.join(options.location, configPath.base))

  if (options.verbose) {
    stringifiedArgs += ' --verbose';
    args.push('--verbose');
  }
  const fullCommand = `${slsCommand} ${stringifiedArgs}`.trim();
  console.log(`Executing Command: ${fullCommand} in cwd: ${projectRoot} `); //${options.package}
  const npxPath = path.resolve(
    context.root,
    'node_modules/serverless',
    'bin',
    'serverless.js'
  );
  subProcess = spawn('node', [npxPath, ...args], {
    stdio: [0, 1, 'pipe', 'ipc'],
    cwd: projectRoot,
    env: {
      // FORCE_COLOR: 'true',
      NODE_OPTIONS: '--enable-source-maps',
      ...process.env,
      [NX_SERVERLESS_BUILD_TARGET_KEY]: options.buildTarget,
    },
  });

  const handleStdErr = (data) => {
    // Don't log out error if task is killed and new one has started.
    // This could happen if a new build is triggered while new process is starting, since the operation is not atomic.
    // Log the error in normal mode
    if (!options.watch || !subProcess.killed) {
      logger.error(data.toString());
    }
  };

  subProcess.stderr.on('data', handleStdErr);
  subProcess.once('exit', (code) => {
    subProcess.off('data', handleStdErr);
    if (options.watch && !subProcess.killed) {
      logger.info(
        `NX Process exited with code ${code}, waiting for changes to restart...`
      );
    }
    // if (!options.watch) done();
    // resolve();
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

function getServerlessArg(options: ServerlessExecutorOptions) {
  const args = ['offline', ...options.args];
  if (options.inspect === true) {
    options.inspect = InspectType.Inspect;
  }
  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`);
  }
  return args;
}

function getExecArgv(options: ServerlessExecutorOptions) {
  const args = [];
  if (options.inspect === true) {
    options.inspect = InspectType.Inspect;
  }

  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`);
  }
  args.push('offline');
  for (const key in options) {
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      if (options[key] !== undefined) {
        args.push(`--${key}=${options[key]}`);
      }
    }
  }
  return args;
}

export default offlineExecutor;
