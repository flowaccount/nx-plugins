import * as _ from 'lodash';
import {
  getPackagePath,
  makeDistFileReadyForPackaging,
  runServerlessCommand,
  ServerlessWrapper,
} from '../../utils/serverless';
/* Fix for EMFILE: too many open files on serverless deploy */
import * as fs from 'fs';
import * as gracefulFs from 'graceful-fs'; // TODO: 0 this is not needed here anymore?
import { preparePackageJson } from '../../utils/packagers';
import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { ExecutorContext, logger } from '@nrwl/devkit';
import { ServerlessDeployBuilderOptions, ServerlessSlsBuilderOptions, SimpleBuildEvent } from '../../utils/types';
import { ScullyBuilderOptions } from '../scully/scully.impl';
gracefulFs.gracefulify(fs); // TODO: 0 this is not needed here anymore?
/* Fix for EMFILE: too many open files on serverless deploy */

export async function deployExecutor(
  options: ServerlessDeployBuilderOptions,
  context: ExecutorContext
) {
  // build into output path before running serverless offline.
  // const packagePath = options.location;
  await ServerlessWrapper.init(options, context);
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
  options.package = getPackagePath(options)
  logger.info(`options.package: ${options.package}`)
  const prepResult = await preparePackageJson(
    options,
    context,
    buildOutput.webpackStats,
    buildOutput.resolverName,
    buildOutput.tsconfig
  ).toPromise();

  if (!prepResult.success) {
    throw new Error(`There was an error with the build. ${prepResult.error}`);
  }


  const extraArgs = [];
  const commands = [];
  commands.push('deploy');
  if (options.function && options.function != '') {
    commands.push('function');
    extraArgs['function'] = `${options.function}`; // fix function deploy /wick
  }
  if (options.list) {
    commands.push('list');
  }
  await runServerlessCommand(options, commands, extraArgs);
  return { success: true };
}

export async function* buildTarget(
  options:
    | (ServerlessDeployBuilderOptions)
    | (ServerlessSlsBuilderOptions)
    | (ScullyBuilderOptions),
  context: ExecutorContext
) {
  for await (const event of startBuild({ buildTarget: options.buildTarget, watch: false}, context)) {
    if (!event.success) {
      logger.error('There was an error with the build. See above.');
      logger.info(`${event.outfile} was not restarted.`);
    }
    yield event;
  }
}

export default deployExecutor;
