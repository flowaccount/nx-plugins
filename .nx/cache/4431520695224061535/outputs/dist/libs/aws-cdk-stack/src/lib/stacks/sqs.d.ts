import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { SQSConfiguration } from '../types';
import { IQueue } from 'aws-cdk-lib/aws-sqs';
export declare class SQSStack extends cdk.Stack {
    readonly output: {
        queues?: IQueue[];
    };
    constructor(scope: Construct, id: string, _props: SQSConfiguration);
}
