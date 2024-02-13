import * as _ from 'lodash';
import {
  ServerlessWrapper,
  getPackagePath,
  makeDistFileReadyForPackaging,
} from '../../utils/serverless';
/* Fix for EMFILE: too many open files on serverless deploy */
import * as fs from 'fs';
import * as gracefulFs from 'graceful-fs'; // TODO: 0 this is not needed here anymore?
import { preparePackageJson } from '../../utils/packagers';
import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { ExecutorContext, logger, parseTargetString } from '@nx/devkit';
import {
  BuildBuilderOptions,
  ServerlessDeployBuilderOptions,
  ServerlessSlsBuilderOptions,
  SimpleBuildEvent,
} from '../../utils/types';
import { ScullyBuilderOptions } from '../scully/scully.impl';
import { detectPackageManager } from '@nx/devkit';
import { getSourceRoot, normalizeBuildOptions } from '../../utils/normalize';
import * as dotnetEnv from 'dotenv-json';
import path = require('path');
import { execSync } from 'child_process';

gracefulFs.gracefulify(fs); // TODO: 0 this is not needed here anymore?
/* Fix for EMFILE: too many open files on serverless deploy */

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

async function getBuildTargetConfiguration(
  targetName: string,
  projectName: string,
  context: ExecutorContext,
  configuration?: string
): Promise<any> {
  const projectConfig = context.workspace.projects[projectName];
  if (projectConfig && projectConfig.targets[targetName]) {
    if (configuration) {
      return {
        ...projectConfig.targets[targetName].options,
        ...projectConfig.targets[targetName].configurations[configuration],
      };
    }
    return projectConfig.targets[targetName].options;
  }
  throw new Error(`Build target '${targetName}' `);
}

export async function deployExecutor(
  options: ServerlessDeployBuilderOptions,
  context: ExecutorContext
) {
  const buildTargetObj = parseTargetString(options.buildTarget);
  const root = getSourceRoot(context);
  const buildOptionsAny = await getBuildTargetConfiguration(
    buildTargetObj.target,
    buildTargetObj.project,
    context,
    buildTargetObj.configuration
  );
  const buildOptions = normalizeBuildOptions(
    <BuildBuilderOptions>buildOptionsAny,
    context.root,
    root
  );
  console.log(buildOptions);
  if (!options.skipBuild) {
    // build into output path before running serverless offline.
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
    const iterator = await buildTarget(options, context);
    const buildOutput = <SimpleBuildEvent>(await iterator.next()).value;
    await makeDistFileReadyForPackaging(options);

    options.package = getPackagePath(options);
    logger.info(`options.package: ${options.package}`);
    const prepResult = await preparePackageJson(
      options,
      context,
      buildOutput.webpackStats,
      buildOutput.resolverName,
      buildOutput.tsconfig
    );
    if (!prepResult.success) {
      throw new Error(`There was an error with the build. ${prepResult.error}`);
    }
    ServerlessWrapper.dispose();
  } else {
    try {
      console.log(buildOptions.servicePath);
      console.log(buildOptions.processEnvironmentFile);
      console.log(
        fs.existsSync(
          path.join(
            buildOptions.servicePath,
            buildOptions.processEnvironmentFile
          )
        )
      );
      if (
        fs.existsSync(
          path.join(
            buildOptions.servicePath,
            buildOptions.processEnvironmentFile
          )
        )
      ) {
        logger.debug(
          'Loading Environment Variables',
          buildOptions.servicePath,
          buildOptions.processEnvironmentFile
        );
        dotnetEnv({
          path: path.join(
            buildOptions.servicePath,
            buildOptions.processEnvironmentFile
          ),
        });
        logger.info(
          `Environment variables set according to ${buildOptions.processEnvironmentFile}`
        );
      } else {
        logger.error('No env.json found! no environment will be set!');
      }
    } catch (e) {
      logger.error(e);
    }
  }

  options.package = getPackagePath(options);
  let stringifiedArgs = `--config ${buildOptions.serverlessConfig} --stage ${options.stage}`; // --package ${options.package}
  if (options.function) {
    stringifiedArgs += ` --function ${options.function}`;
  }
  if (options.verbose) {
    stringifiedArgs += ` --verbose`;
  }

  const IS_CI_RUN = process.env.CI == 'true';
  const slsCommand = getSlsCommand();
  const fullCommand = `${slsCommand} deploy ${stringifiedArgs}`.trim();
  console.log(`Executing Command: ${fullCommand} in cwd: ${options.package}`);

  try {
    execSync(fullCommand, { stdio: 'inherit', cwd: options.package }); // || process.cwd()
  } catch (error) {
    // An error occurred (non-zero exit code)
    console.error(error);
    return { success: false }; // Exit the program with a non-zero status code
  }
  if (IS_CI_RUN) {
    // console.log(result.all);
  }

  // const extraArgs = [];
  // const commands = [];
  // commands.push('deploy');
  // if (options.function && options.function != '') {
  //   console.log(`pushing function command ${options.function}`)
  //   commands.push('function');
  //   extraArgs.push(`--function ${options.function}`); // fix function deploy /wick
  // }
  // if (options.list) {
  //   commands.push('list');
  // }
  // if(!options.args) {
  //   delete options.args;
  // }
  // if(options.verbose) {
  //   extraArgs.push('--verbose');
  // }
  // await runServerlessCommand(options, commands, extraArgs);
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
