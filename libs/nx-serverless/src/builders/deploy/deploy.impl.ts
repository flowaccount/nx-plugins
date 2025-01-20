import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { ExecutorContext, logger } from '@nx/devkit';
import {
  ServerlessDeployBuilderOptions,
  ServerlessSlsBuilderOptions,
  SimpleBuildEvent,
} from '../../utils/types';
import { ScullyBuilderOptions } from '../scully/scully.impl';
import { detectPackageManager } from '@nx/devkit';
import { getProjectConfiguration, getProjectRoot } from '../../utils/normalize';
import chalk from 'chalk';
import dotEnvJson from 'dotenv-json';

import { execSync } from 'child_process';

import { NX_SERVERLESS_BUILD_TARGET_KEY } from '../../nrwl/nx-facade';
import { NPM } from '../../utils/packagers/npm';
import { Yarn } from '../../utils/packagers/yarn';
import { packager } from '../../utils/packagers';
import { WebpackExecutorOptions } from '@nx/webpack';

function getSlsCommand() {
  const packageManager = detectPackageManager();
  switch (packageManager) {
    case 'pnpm':
    case 'yarn':
    case 'npm':
    default:
      return 'npx sls';
  }
}

function getBuildTargetConfiguration(
  targetName: string,
  context: ExecutorContext
): WebpackExecutorOptions {
  const projectConfig = getProjectConfiguration(context);

  const targetSplit = targetName.split(':');
  const finalName = targetSplit[1];
  const configuration = targetSplit[2];

  if (projectConfig && projectConfig.targets[finalName]) {
    if (configuration) {
      return {
        ...projectConfig.targets[finalName].options,
        ...projectConfig.targets[finalName].configurations[configuration],
      };
    }
    return projectConfig.targets[targetName].options;
  }
  throw new Error(`Build target '${targetName}' `);
}

function getPackagerInstance(options) {
  let packagerInstance = null;
  if (options.packager && options.packager.toString().toLowerCase() == 'npm') {
    packagerInstance = NPM;
  } else if (
    options.packager &&
    options.packager.toString().toLowerCase() == 'yarn'
  ) {
    packagerInstance = Yarn;
  } else if (packager('npm')) {
    packagerInstance = NPM;
  } else if (packager('yarn')) {
    packagerInstance = Yarn;
  } else {
    return {
      success: false,
      error: 'No Packager to process package.json, please install npm or yarn',
    };
  }
  logger.info(`packager instance is -- ${options.packager}`);
  return packagerInstance;
}

export async function deployExecutor(
  options: ServerlessDeployBuilderOptions,
  context: ExecutorContext
) {
  //  const { target, project, configuration } = parseTargetString(options.buildTarget, context);
  // const root = getSourceRoot(context);

  // const buildOptions = await getBuildTargetConfiguration(
  //   target,
  //   context,
  //   configuration
  // );

  // const buildOptions = normalizeBuildOptions(
  //   <BuildBuilderOptions>buildOptionsAny,
  //   context.root,
  //   root
  // );
  const projectRoot = getProjectRoot(context);
  const info = chalk.bold.green('info');
  dotEnvJson({
    path: `${projectRoot}/${options.processEnvironmentFile ?? 'env.json'}`,
  });

  if (!options.skipBuild) {
    // build into output path before running serverless offline.
    if (options.waitUntilTargets && options.waitUntilTargets.length > 0) {
      const results = await runWaitUntilTargets(
        options.waitUntilTargets,
        context
      );
      for (const [i, result] of results.entries()) {
        if (!result.success) {
          throw new Error(
            `Wait until target failed: ${options.waitUntilTargets[i]}.`
          );
        }
      }
    }
    const iterator = await buildTarget(options, context);
    const buildOutput = <SimpleBuildEvent>(await iterator.next()).value;
    if (buildOutput.error) {
      throw new Error(buildOutput.error);
    }
  }

  // options.package = getPackagePath(options);
  let stringifiedArgs = `--stage ${options.stage}`;
  if (options.function) {
    stringifiedArgs += ` --function ${options.function}`;
  }
  if (options.verbose) {
    stringifiedArgs += ` --verbose`;
  }
  const buildConfig = getBuildTargetConfiguration(options.buildTarget, context);
  const IS_CI_RUN = process.env.CI == 'true';
  const slsCommand = getSlsCommand();
  const fullCommand = `${slsCommand} deploy ${stringifiedArgs}`.trim();
  logger.info(`nx Executing Command: ${fullCommand} in cwd: ${projectRoot}`);
  //const npxPath = path.resolve(context.root, 'node_modules/serverless', 'bin', 'serverless.js');
  try {
    const packagerInstance = getPackagerInstance(options);
    logger.info(
      `${info} installing yarn on ${context.root}/${buildConfig.outputPath}`
    );
    const result = await packagerInstance.install(
      `${context.root}/${buildConfig.outputPath}`
    );
    if (result.error) {
      logger.error('ERROR: generating lock file!');
      return { success: false, error: result.error.toString() };
    }
    execSync(fullCommand, {
      stdio: 'inherit',
      cwd: projectRoot,
      env: {
        FORCE_COLOR: 'true',
        NODE_OPTIONS: '--enable-source-maps',
        ...process.env,
        [NX_SERVERLESS_BUILD_TARGET_KEY]: options.buildTarget,
      },
    });
  } catch (error) {
    logger.error(error);
    return { success: false }; // Exit the program with a non-zero status code
  }
  if (IS_CI_RUN) {
    //logger.info("what do you want to see here?");
  }
  return { success: true };
}

export async function* buildTarget(
  options:
    | ServerlessDeployBuilderOptions
    | ServerlessSlsBuilderOptions
    | ScullyBuilderOptions,
  context: ExecutorContext
) {
  for await (const event of startBuild(
    { buildTarget: options.buildTarget, watch: false },
    context
  )) {
    if (!event.success) {
      logger.error('There was an error with the build. See above.');
      logger.info(`${event.outfile} was not restarted.`);
    }
    yield event;
  }
}

export default deployExecutor;
