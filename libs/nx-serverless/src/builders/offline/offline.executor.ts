import { exec, execSync, fork, spawn } from 'child_process';
import { ExecutorContext, joinPathFragments } from '@nrwl/devkit';
import ignore from 'ignore';
import { readFileSync } from 'fs';
import { watch } from 'chokidar';
import { workspaceLayout } from '@nrwl/workspace/src/core/file-utils';
import { InspectType, ServerlessExecuteBuilderOptions } from './offline.impl';

function getHttpServerArgs(options: ServerlessExecuteBuilderOptions) {
  const args = [] as any[];
  if (options.port) {
    args.push(`-p ${options.port}`);
  }
  if (options.host) {
    args.push(`-a ${options.host}`);
  }
  if (options.ssl) {
    args.push(`-S`);
  }
  if (options.sslCert) {
    args.push(`-C ${options.sslCert}`);
  }
  if (options.sslKey) {
    args.push(`-K ${options.sslKey}`);
  }
  if (options.proxyUrl) {
    args.push(`-P ${options.proxyUrl}`);
  }
  return args;
}

function getBuildTargetCommand(options: ServerlessExecuteBuilderOptions) {
  // "config": "apps/test-api-8/serverless.yml",
  //         "location": "dist/apps/test-api-8",
  //         "port": 7777
  const cmd = [
    'node',
    'D:/Projects/opensource/nx-11-test/nx-11-test-serverless/node_modules/serverless/bin/serverless.js',
    'offline',
    '--config apps/test-api-11/serverless.yml --location dist/apps/test-api-11 --port 7777',
  ];
  //   cmd.push(`offline`);

  // //   if (options.parallel) {
  // //     cmd.push(`--parallel`);
  // //   }
  // //   if (options.maxParallel) {
  // //     cmd.push(`--maxParallel=${options.maxParallel}`);
  // //   }
  return cmd.join(' ');
}

function getBuildTargetOutputPath(
  options: ServerlessExecuteBuilderOptions,
  context: ExecutorContext
) {
  let buildOptions;
  try {
    const [project, target, config] = options.buildTarget.split(':');

    const buildTarget = context.workspace.projects[project].targets[target];
    buildOptions = config
      ? { ...buildTarget.options, ...buildTarget.configurations[config] }
      : buildTarget.options;
  } catch (e) {
    throw new Error(`Invalid buildTarget: ${options.buildTarget}`);
  }

  // TODO: vsavkin we should also check outputs
  const outputPath = buildOptions.outputPath;
  if (!outputPath) {
    throw new Error(
      `Invalid buildTarget: ${options.buildTarget}. The target must contain outputPath property.`
    );
  }

  return outputPath;
}

function getIgnoredGlobs(root: string) {
  const ig = ignore();
  try {
    ig.add(readFileSync(`${root}/.gitignore`, 'utf-8'));
  } catch {}
  try {
    ig.add(readFileSync(`${root}/.nxignore`, 'utf-8'));
  } catch {}
  return ig;
}

function createFileWatcher(
  root: string,
  sourceRoot: string,
  changeHandler: () => void
) {
  const ignoredGlobs = getIgnoredGlobs(root);
  console.log(sourceRoot + '/**');
  const watcher = watch([sourceRoot + '/**'], {
    cwd: root,
    ignoreInitial: true,
  });
  watcher.on('all', (_event: string, path: string) => {
    console.log('something happened');
    if (ignoredGlobs.ignores(path)) return;
    changeHandler();
  });
  return { close: () => watcher.close() };
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

export async function* serverlessOfflineExecutor(
  options: ServerlessExecuteBuilderOptions,
  context: ExecutorContext
) {
  console.log('executing offline');
  let running = false;

  const run = () => {
    console.log('running?' + running);
    if (!running) {
      running = true;
      try {
        console.log('fork process');
        console.log(getExecArgv(options));
        fork('node_modules/serverless/bin/serverless.js', getExecArgv(options));
        // execSync(getBuildTargetCommand(options), {
        //   stdio: [0, 1, 2],
        // });
      } catch {}
      running = false;
    }
  };
  console.log('watching:' + context.root);
  const watcher = createFileWatcher(
    context.root,
    context.workspace.projects[context.projectName].root,
    run
  );

  // perform initial run
  run();

  // const outputPath = getBuildTargetOutputPath(options, context);
  // const args = getHttpServerArgs(options);
  // console.log('executing serve');
  // const serve = exec(
  //   `node D:/Projects/opensource/nx-11-test/nx-11-test-serverless/node_modules/serverless/lib/Serverless.js offline --config apps/test-api-11/serverless.yml --location dist/apps/test-api-11 --port 7777`,
  //   {
  //     cwd: context.root,
  //   }
  // );
  // const processExitListener = () => {
  //   serve.kill();
  //   watcher.close();
  // };
  // process.on('exit', processExitListener);
  // process.on('SIGTERM', processExitListener);
  // serve.stdout.on('data', (chunk) => {
  //   if (chunk.toString().indexOf('GET') === -1) {
  //     process.stdout.write(chunk);
  //   }
  // });
  // serve.stderr.on('data', (chunk) => {
  //   process.stderr.write(chunk);
  // });

  yield {
    success: true,
    baseUrl: `${options.ssl ? 'https' : 'http'}://${options.host}:${
      options.port
    }`,
  };

  return new Promise<{ success: boolean }>(() => {
    success: true;
  });
}

export default serverlessOfflineExecutor;
