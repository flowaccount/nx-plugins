import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as lambdaEvent from '@aws-cdk/aws-lambda-event-sources';
import { TypeScriptCode } from '../lambda-asset-code/typescript-code';
import path = require('path');
import { copy } from 'fs-extra';
import { LambdaStackProperties } from '../types';
import { Stack } from '@aws-cdk/core';
import { Stream } from '@aws-cdk/aws-kinesis';
import { SecurityGroup } from '@aws-cdk/aws-ec2';
import { logger, readProjectConfiguration } from '@nrwl/devkit';

export class TypescriptLambdaStack extends Stack {
  public readonly output: { lambdaFunctions?: lambda.Function[] };

  constructor(scope: cdk.Construct, id: string, _props: LambdaStackProperties) {
    super(scope, id, _props);
    this.templateOptions.description =
      'To produce aws resource to log data into elasticsearch and backup to s3';

    const lambdas: lambda.Function[] = [];

    _props.functions.forEach((f) => {
      const rootPath = process.cwd();
      const code = TypeScriptCode.asset(`${rootPath}/${f.srcRootPath}`);
      logger.info(
        `Initiating Lambda Function ${f.functionName}:${rootPath}/${f.srcRootPath}`
      );
      const functionProps = {
        ...f,
        code: code, // , `${rootPath}/dist/${f.srcRootPath}`
        vpc: _props.vpc,
        vpcSubnets: _props.subnets,
        role: _props.role,
        securityGroups: f.securityGroupIds.map((secgroupId) =>
          SecurityGroup.fromSecurityGroupId(
            this,
            `${id}-${secgroupId}-sg`,
            secgroupId
          )
        ),
      };
      const lambdaFunction = new lambda.Function(
        this,
        `${id}-${functionProps.functionName}`,
        functionProps
      );
      if (f.eventProperties?.kinesisEventSource) {
        logger.info(
          `attaching data stream ${f.eventProperties?.kinesisEventSource.dataStreamArn}`
        );
        const stream = Stream.fromStreamArn(
          this,
          'dataStreamSource',
          f.eventProperties?.kinesisEventSource.dataStreamArn
        );
        lambdaFunction.addEventSource(
          new lambdaEvent.KinesisEventSource(stream, {
            startingPosition: lambda.StartingPosition.LATEST,
          })
        );
      }
      if (f.eventProperties?.sqsEventSource) {
        logger.info(
          `attaching sqs ${f.eventProperties?.sqsEventSource.queue.queueName}`
        );
        lambdaFunction.addEventSource(
          new lambdaEvent.SqsEventSource(
            f.eventProperties?.sqsEventSource.queue,
            f.eventProperties?.sqsEventSource.properties
          )
        );
      }
      lambdas.push(lambdaFunction);
    });
    this.output = { lambdaFunctions: lambdas };
  }
}
