import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SQSConfiguration } from '../types';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
import { logger } from '@nx/devkit';
// import { PrincipalWithConditions } from "aws-cdk-lib/aws-iam";
//import firehose = require("aws-cdk-lib/aws-kinesisfirehose");
// const indexName = 'log-stamp-index';

export class SQSStack extends cdk.Stack {
  public readonly output: {
    queues?: IQueue[];
  };
  constructor(scope: Construct, id: string, _props: SQSConfiguration) {
    super(scope, id, _props);
    logger.info('Initiating SQS');
    this.output = { queues: [] };
    this.templateOptions.description = 'To produce sqs according to properties';

    _props.sqs.forEach((sqsProps) => {
      const queue = new sqs.Queue(
        this,
        `${id}-sqs-${sqsProps.queueName}`,
        sqsProps
      );
      this.output.queues.push(queue);
    });
    logger.info('🦂');
  }
}
