import {
  convertNxGenerator,
  formatFiles,
  generateFiles,
  logger,
  names,
  offsetFromRoot,
  Tree,
} from '@nx/devkit';
import { normalizeOptions, updateWorkspaceJson } from '../common-schematics';
import { Schema } from '../schema';
import { jestProjectGenerator } from '@nx/jest';
import { lintProjectGenerator } from '@nx/eslint';
import * as path from 'path';
import { NormalizedSchema } from '../normalized-schema';
import {
  IApplicationStackEnvironmentConfig,
  // ServerlessApplicationStackConfiguration,
  SqsConfigurationBuilderOption,
  LambdaConfigurationBuilderOption,
  SqsStackBuilder,
  // ServerlessApplicationBuilder
} from '@flowaccount/aws-cdk-stack';
// import { SqsStackBuilder } from '../../stacks/builders/sqs-stack-builder';
// import { ServerlessApplicationBuilder } from "../../stacks/builders/serverless-application-builder";
import {
  classify,
  dasherize,
  camelize,
  underscore,
} from '@angular-devkit/core/src/utils/strings';
const stringUtils = { classify, dasherize, camelize, underscore };

function initStack(
  host: Tree,
  options: NormalizedSchema,
  filesRelativePath: string
) {
  //add builder to build template options from input options
  const stagingEnvironmentConfig: IApplicationStackEnvironmentConfig = {
    region: options.region,
    stackName: options.name,
    stage: 'staging',
    _app: options.name,
    _isProduction: false,
  };
  const productionEnvironmentConfig: IApplicationStackEnvironmentConfig = {
    region: options.region,
    stackName: options.name,
    stage: 'production',
    _app: options.name,
    _isProduction: false,
  };

  const sqsOptions: SqsConfigurationBuilderOption = {
    builderName: 'SqsConfigurationBuilder',
    queueName: `test-sqs`,
    visibilityTimeout: 60,
  };
  stagingEnvironmentConfig.sqs = [
    new SqsStackBuilder(stagingEnvironmentConfig, sqsOptions).BuildSqsStack(),
  ];

  const _lambdaFunctions: LambdaConfigurationBuilderOption[] = [];

  for (let i = 0; i < options.functionNames.length; i++) {
    _lambdaFunctions.push({
      builderName: 'TypescriptLambdaConfigurationBuilder',
      securityGroupIds: options.securityGroupIds,
      handler: options.handlers[i],
      memmorySize: options.memmorySizes[i] ? options.memmorySizes[i] : 256,
      timeout: options.timeouts[i] ? options.timeouts[i] : 60,
      name: options.functionNames[i],
    });
  }
  const subnets: { id: string; availabilityZone: string }[] = [];
  for (let i = 0; i < options.subnetIds.length; i++) {
    for (let j = 0; j < options.availabilityZones.length; j++) {
      subnets.push({
        id: options.subnetIds[i],
        availabilityZone: `${options.region}${options.availabilityZones[j]}`,
      });
    }
  }

  // _lambdaFunctions[0].eventProperties.sqsEventSource = options.sqsEvent ?  :

  // stagingEnvironmentConfig.serverless = <ServerlessApplicationStackConfiguration>(new ServerlessApplicationBuilder(stagingEnvironmentConfig, _lambdaFunctions).BuildStackConfiguration())

  const templateOptions = {
    ...stringUtils,
    ...options,
    ...names(options.name), // name: options.name,
    offset: offsetFromRoot(options.appProjectRoot),
    template: '',
    root: options.appProjectRoot,
    vpcId: options.vpcId,
    rds: false,
    sqs: { ...stagingEnvironmentConfig.sqs },
    lambdaFunctions: { ..._lambdaFunctions },
    subnets: subnets,
    stage: stagingEnvironmentConfig.stage,
    isProduction: stagingEnvironmentConfig._isProduction,
    accountid: options.accountid,
  };

  generateFiles(
    host,
    path.join(__dirname, filesRelativePath),
    options.appProjectRoot,
    templateOptions
  );
}

export async function slsApplicationGenerator(host: Tree, schema: Schema) {
  logger.info('normalizing options');
  const options = normalizeOptions(schema);
  // initGenerator(host, {
  //   skipFormat: true,
  //   expressProxy: false,
  //   unitTestRunner: options.unitTestRunner,
  // });
  initStack(host, options, 'files');
  updateWorkspaceJson(host, options);
  await lintProjectGenerator(host, { project: options.name, skipFormat: true });
  // if (!options.unitTestRunner || options.unitTestRunner === 'jest') {
  //   await jestProjectGenerator(host, {
  //     project: options.name,
  //     setupFile: 'none',
  //     skipSerializers: true,
  //   });
  // }
  await formatFiles(host);
}

export default slsApplicationGenerator;
export const appSchematic = convertNxGenerator(slsApplicationGenerator);
