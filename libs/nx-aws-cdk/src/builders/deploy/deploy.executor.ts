import {
  AwsCdkClient,
  awsCdkFactory,
  cdkDeployFlags,
  cdkFlags,
  getDeployOptions,
} from '@flowaccount/aws-cdk-core';
import { resolve } from 'path';
import { DeployExecutorSchema } from './schema';
import { getCdkOptions, getSynthOptions } from '@flowaccount/aws-cdk-core';
import {
  ExecutorContext,
  logger,
  parseTargetString,
  runExecutor,
} from '@nrwl/devkit';
import { NodeBuildEvent } from '@nrwl/node/src/executors/build/build.impl';

export default async function runSynthExecutor(
  options: DeployExecutorSchema,
  context: ExecutorContext,
  awscdkClient: AwsCdkClient = new AwsCdkClient(awsCdkFactory())
) {
  logger.info(`Building the cdk application`);
  const iterator = await buildTarget(options, context);
  const buildOutput = <NodeBuildEvent>(await iterator.next()).value;
  if (!buildOutput.success) {
    return {
      success: false,
    };
  }
  logger.info(`output file ${buildOutput.outfile}`);
  logger.info('Preparing cdk deploy command');
  // const nxProjectConfiguration = getExecutedProjectConfiguration(context);
  awscdkClient.cwd = context.cwd;
  awscdkClient.printSdkVersion();
  options.output = options.output
    ? resolve(context.root, options.output)
    : resolve(context.root, 'dist/cdk.out');

  const deployOptionFlag = options as { [key in cdkDeployFlags]?: string };
  const cdkOptionFlag = options as { [key in cdkFlags]?: string };
  cdkOptionFlag.app = `node ${buildOutput.outfile}`;
  const deployOption = getDeployOptions(deployOptionFlag);
  const cdkOption = getCdkOptions(cdkOptionFlag);
  const stackSuffix = context.configurationName
    ? context.configurationName
    : 'dev';
  awscdkClient.deploy(
    `${options.stackName}-${stackSuffix}`,
    cdkOption,
    deployOption
  );
  return {
    success: true,
  };
}

export async function* buildTarget(
  options: DeployExecutorSchema,
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
  options: DeployExecutorSchema,
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

// export const getExecutedProjectConfiguration = (context: ExecutorContext) =>
//   context.workspace.projects[context.projectName as string];
