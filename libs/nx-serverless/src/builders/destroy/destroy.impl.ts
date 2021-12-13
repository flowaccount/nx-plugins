import { BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { runServerlessCommand } from '../../utils/serverless';
import {
  buildTarget,
  ServerlessDeployBuilderOptions,
} from '../deploy/deploy.impl';
import { ExecutorContext, logger } from '@nrwl/devkit';

export type ServerlesCompiledEvent = {
  outfile: string;
};

export async function destroyExecutor(
  options: JsonObject & ServerlessDeployBuilderOptions,
  context: ExecutorContext
) {
  const iterator = await buildTarget(options, context);
  const event = <BuilderOutput>(await iterator.next()).value; // ServerlessBuildEvent
  if (event.success) {
    // build into output path before running serverless offline.
    const commands = [];
    commands.push('remove');
    await runServerlessCommand(options, commands);
    return { success: true };
  } else {
    logger.error('There was an error with the build. See above.');
    logger.info(`${event.outfile} was not restarted.`);
    throw new Error(`${event.outfile} was not restarted.`);
  }
}
