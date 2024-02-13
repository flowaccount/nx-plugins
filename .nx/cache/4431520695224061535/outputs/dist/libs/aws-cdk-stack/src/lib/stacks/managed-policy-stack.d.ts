import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { PolicyStackProperties } from '../types';
export declare class ManagedPolicyStack extends Stack {
    readonly output: {
        policy: ManagedPolicy;
    };
    constructor(scope: Construct, id: string, _props: PolicyStackProperties);
}
