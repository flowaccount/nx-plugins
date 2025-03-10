import {
  AwsCdkClient,
  awsCdkFactory,
  cdkDeployFlags,
  cdkFlags,
  getDeployOptions,
} from '@flowaccount/aws-cdk-core';
import { resolve } from 'path';
import { DeployExecutorSchema } from './schema';
import { getCdkOptions } from '@flowaccount/aws-cdk-core';
import {
  ExecutorContext,
  logger,
  parseTargetString,
  runExecutor,
} from '@nx/devkit';
import { WebpackExecutorEvent } from '@nx/webpack/src/executors/webpack/webpack.impl';

export default async function runSynthExecutor(
  options: DeployExecutorSchema,
  context: ExecutorContext,
  awscdkClient: AwsCdkClient = new AwsCdkClient(awsCdkFactory())
) {
  logger.info(`Building the cdk application`);
  const iterator = await buildTarget(options, context);
  const buildOutput = <WebpackExecutorEvent>(await iterator.next()).value;
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

  // argument
  const argsss = options;
  if (argsss) {
    process.env.serviceName = argsss['serviceName'];
    process.env.targetGroupArn = argsss['targetGroupArn'];
    process.env.secretArn = argsss['secretArn'];
    process.env.asgName = argsss['asgName'];
    process.env.portMap = argsss['portMap'];
    process.env.site = argsss['site'];
    process.env.stage = argsss['stage'];
    process.env.imageName = argsss['imageName'];
    process.env.cloudmapServiceName = argsss['cloudmapServiceName'];
    process.env.cloudmapServiceArn = argsss['cloudmapServiceArn'];
    process.env.cloudmapServiceId = argsss['cloudmapServiceId'];
    process.env.cpu = argsss['cpu'];
    process.env.memory = argsss['memory'];
    process.env.useServiceDiscovery = argsss['useServiceDiscovery'];
    process.env.existingCluster = argsss['existingCluster'];
    process.env.keyPairName = argsss['keyPairName'];
    process.env.existingRole = argsss['existingRole'];
    process.env.owner = argsss['owner'];
  }

  // require('dotenv-json')(argsss)

  // cdkOption.push({ flag: "serviceName", value: argsss["serviceName"] });
  // cdkOption.push({ flag: "targetGroupArn", value: argsss["targetGroupArn"]  });
  // cdkOption.push({ flag: "secretArn", value: argsss["secretArn"]  });

  logger.info(cdkOption);
  // in cdkOption MUST already have the service-name argument from process.argv -- success!

  // in environment.ts inside dotnet.workspace in environment.sandbox.ts
  // usage is const serviceName = process.argv["service-name"]
  awscdkClient.deploy(`${options.stackName}`, cdkOption, deployOption);
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
  const buildTarget = parseTargetString(
    options.buildTarget,
    context.projectGraph
  );
  yield* await runExecutor<WebpackExecutorEvent>(
    buildTarget,
    {
      // watch: options.watch,
    },
    context
  );
}

// export const getExecutedProjectConfiguration = (context: ExecutorContext) =>
//   context.workspace.projects[context.projectName as string];
function parseArgs() {
  const args = process.argv;
  return args
    .map((t) => t.trim())
    .reduce((m, c) => {
      if (c.startsWith('--')) {
        const [key, value] = c.substring(2).split('=');
        if (!key || !value) {
          throw new Error(`Invalid args: ${args}`);
        }
        if (!m) m = {};
        m[key] = value;
        return m;
      }
    }, {});
}
