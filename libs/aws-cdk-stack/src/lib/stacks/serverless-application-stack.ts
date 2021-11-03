import { Construct, NestedStack, Stack } from '@aws-cdk/core';

import { logger } from '@nrwl/devkit';
import { ServerlessApplicationStackProperties } from '../types';
import { TypescriptLambdaStack } from './lambda-stack';
import { ManagedPolicyStack } from './managed-policy-stack';

export class ServerlessApplicationStack extends NestedStack {
  constructor(
    scope: Construct,
    id: string,
    _props: ServerlessApplicationStackProperties
  ) {
    super(scope, id, _props);

    logger.info('Start Serverless Application Deployment Initiation');
    const lambdaStack = new TypescriptLambdaStack(
      scope,
      `${id}-serverless-typescript-lambda`,
      {
        vpc: _props.vpc,
        subnets: _props.subnets,
        functions: _props.lambda,
        role: _props.role,
      }
    );
    logger.info('Serverless Application Deployment Initiation Done!');
    lambdaStack.output.lambdaFunctions?.forEach((l) => {
      logger.info(`Initiated Lambda Function--> ${l.functionName}`);
    });
    logger.info(`Initiated Role -->  ${_props.role.roleName}`);
    logger.info('🥳👆');
  }
}
