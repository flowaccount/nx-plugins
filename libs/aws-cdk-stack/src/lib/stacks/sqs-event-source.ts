import { Queue } from '@aws-cdk/aws-sqs';
import { Stack, App, StackProps, CfnOutput } from '@aws-cdk/core';

export class CdkStarterStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new Queue(this, 'sqs-queue');
    new CfnOutput(this, 'dynamoDbArn', { value: queue.queueArn });
  }
}
