import * as _ from 'lodash';
import {
  makeDistFileReadyForPackaging,
  runServerlessCommand,
} from '../../utils/serverless';
/* Fix for EMFILE: too many open files on serverless deploy */
import * as fs from 'fs';
import * as gracefulFs from 'graceful-fs';
import { preparePackageJson } from '../../utils/packagers';
import { runWaitUntilTargets } from '../../utils/target.schedulers';
import { buildTarget } from '../deploy/deploy.impl';
import { ExecutorContext } from '@nrwl/devkit';
import { ServerlessSlsBuilderOptions, SimpleBuildEvent } from '../../utils/types';
gracefulFs.gracefulify(fs);
/* Fix for EMFILE: too many open files on serverless deploy */
// review: Have to spin off options and clarify schema.json for deploy,build,serve


export async function slsExecutor(
  options: ServerlessSlsBuilderOptions,
  context: ExecutorContext
) {
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
  const builderOutput = <SimpleBuildEvent>(await iterator.next()).value;
  const prepResult = await preparePackageJson(
    options,
    context,
    builderOutput.webpackStats,
    builderOutput.resolverName,
    builderOutput.tsconfig
  ).toPromise();
  if (!prepResult.success) {
    throw new Error(`There was an error with the build. ${prepResult.error}`);
  }
  await makeDistFileReadyForPackaging(options);
  const commands = [];
  commands.push(options.command);
  await runServerlessCommand(options, commands);
  return { success: true };
}
