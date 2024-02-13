import { DatabaseInstanceReadReplica, IDatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { DatabaseReadonlyReplicaProps } from '../types';
export declare class RdsReadReplicaStack extends Stack {
    readonly output: {
        readReplica: DatabaseInstanceReadReplica;
        instance: IDatabaseInstance;
    };
    constructor(scope: Construct, id: string, _props: DatabaseReadonlyReplicaProps);
}
