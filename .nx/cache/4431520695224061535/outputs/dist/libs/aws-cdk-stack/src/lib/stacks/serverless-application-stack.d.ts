import { NestedStack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ServerlessApplicationStackProperties } from '../types';
export declare class ServerlessApplicationStack extends NestedStack {
    constructor(scope: Construct, id: string, _props: ServerlessApplicationStackProperties);
}
