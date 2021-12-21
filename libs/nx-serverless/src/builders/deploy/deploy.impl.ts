import { JsonObject } from '@angular-devkit/core';
import * as _ from 'lodash';
import {
  getExecArgv,
  makeDistFileReadyForPackaging,
  runServerlessCommand,
  ServerlessWrapper,
} from '../../utils/serverless';
/* Fix for EMFILE: too many open files on serverless deploy */
import * as fs from 'fs';
import * as gracefulFs from 'graceful-fs'; // TODO: 0 this is not needed here anymore?
import { preparePackageJson } from '../../utils/packagers';
import { runWaitUntilTargets, startBuild } from '../../utils/target.schedulers';
import { Packager } from '../../utils/enums';
import { ExecutorContext, logger } from '@nrwl/devkit';
import { ServerlessSlsBuilderOptions } from '../sls/sls.impl';
import { ScullyBuilderOptions } from '../scully/scully.impl';
import { BuildResult } from '@angular-devkit/build-webpack';
gracefulFs.gracefulify(fs); // TODO: 0 this is not needed here anymore?
/* Fix for EMFILE: too many open files on serverless deploy */
export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk',
}

// review: Have to spin off options and clarify schema.json for deploy,build,serve
export interface ServerlessDeployBuilderOptions extends JsonObject {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  host: string;
  port: number;
  watch: boolean;
  package: string;
  location: string;
  stage: string;
  list: boolean;
  updateConfig: boolean;
  function?: string;
  verbose?: boolean;
  sourceRoot?: string;
  root?: string;
  ignoreScripts: boolean;
  packager?: Packager;
  serverlessPackagePath?: string;
  args?: string;
}

export async function deployExecutor(
  options: JsonObject & ServerlessDeployBuilderOptions,
  context: ExecutorContext
) {
  // build into output path before running serverless offline.
  let packagePath = options.location;
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
  const buildOutput = <BuildResult>(await iterator.next()).value;

  const prepResult = await preparePackageJson(
    options,
    context,
    buildOutput.webpackStats,
    buildOutput.resolverName.toString(),
    buildOutput.tsconfig.toString()
  ).toPromise();

  if (!prepResult.success) {
    throw new Error(`There was an error with the build. ${prepResult.error}`);
  }

  await makeDistFileReadyForPackaging(options);
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
    | (JsonObject & ServerlessDeployBuilderOptions)
    | (JsonObject & ServerlessSlsBuilderOptions)
    | (JsonObject & ScullyBuilderOptions),
  context: ExecutorContext
) {
  for await (const event of startBuild(options, context)) {
    if (!event.success) {
      logger.error('There was an error with the build. See above.');
      logger.info(`${event.outfile} was not restarted.`);
    }
    yield event;
  }
}

export default deployExecutor;
