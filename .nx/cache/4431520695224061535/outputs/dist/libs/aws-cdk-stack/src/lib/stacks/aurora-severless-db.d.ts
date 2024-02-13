import { AuroraServerlessDbStackProperties } from '../types';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ServerlessCluster } from 'aws-cdk-lib/aws-rds';
export declare class AuroraServerlessDbStack extends Stack {
    readonly output: {
        auroraArn: string;
        db: ServerlessCluster;
    };
    constructor(scope: Construct, id: string, _props: AuroraServerlessDbStackProperties);
}
