import { AwsCdkClient, awsCdkFactory, cdkFlags } from '@flowaccount/aws-cdk-core'
import { resolve } from 'path';
import { SynthExecutorSchema } from './schema';
import { cdkSynthFlags, getCdkOptions , getSynthOptions} from '@flowaccount/aws-cdk-core';
import { ExecutorContext, logger, parseTargetString, runExecutor } from '@nrwl/devkit';
import { NodeBuildEvent } from '@nrwl/node/src/executors/build/build.impl';

export default async function runSynthExecutor(
  options: SynthExecutorSchema,
  context: ExecutorContext,
  awscdkClient: AwsCdkClient = new AwsCdkClient(awsCdkFactory())
) {

  logger.info(`Building the cdk application`)
  const iterator = await buildTarget(options, context);
  const buildOutput = <NodeBuildEvent>(await iterator.next()).value;
  if(!buildOutput.success){
    return {
      success: false,
    };
  }
  logger.info(`output file ${buildOutput.outfile}`)
  logger.info("Preparing cdk synth command")
  awscdkClient.cwd = context.cwd;
  awscdkClient.printSdkVersion();
  options.output = options.output
    ? resolve(context.root, options.output)
    : resolve(context.root, 'dist/cdk.out');
  
  const synthOptionFlag = options as { [key in cdkSynthFlags]?: string }
  const cdkOptionFlag = options as { [key in cdkFlags]?: string }
  cdkOptionFlag.app = `node ${buildOutput.outfile}`
  const synthOption = getSynthOptions(synthOptionFlag)
  const cdkOption = getCdkOptions(cdkOptionFlag)
  const stackSuffix = context.configurationName ? context.configurationName : 'dev'
  awscdkClient.synth(`${options.stackName}-${stackSuffix}`, cdkOption, synthOption);
  return {
    success: true,
  };
}

export async function* buildTarget(
  options: SynthExecutorSchema,
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

async function* startBuild(
  options: SynthExecutorSchema,
  context: ExecutorContext
) {
  const buildTarget = parseTargetString(options.buildTarget);
  yield* await runExecutor<NodeBuildEvent>(
    buildTarget,
    {
      watch: options.watch,
    },
    context
  );
}