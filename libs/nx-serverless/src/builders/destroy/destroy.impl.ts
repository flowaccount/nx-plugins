import { runServerlessCommand } from '../../utils/serverless';
import { buildTarget } from '../build/build.impl';
import { ExecutorContext, logger } from '@nx/devkit';
import {
  ServerlessDeployBuilderOptions,
  SimpleBuildEvent,
} from '../../utils/types';

export type ServerlesCompiledEvent = {
  outfile: string;
};

export async function destroyExecutor(
  options: ServerlessDeployBuilderOptions,
  context: ExecutorContext
) {
  const iterator = await buildTarget(options, context);
  const event = <SimpleBuildEvent>(await iterator.next()).value; // ServerlessBuildEvent
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
