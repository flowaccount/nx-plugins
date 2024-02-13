import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ElasticsearchStackProperties } from '../types';
export declare class ElasticsearchStack extends cdk.Stack {
    readonly output: {
        domainArn?: string;
    };
    constructor(scope: Construct, id: string, _props: ElasticsearchStackProperties);
}
