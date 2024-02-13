import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { DynamoDbEnvironmentProps } from '../types';
export declare class DynamoDbStack extends Stack {
    constructor(scope: Construct, id: string, _props: DynamoDbEnvironmentProps);
}
