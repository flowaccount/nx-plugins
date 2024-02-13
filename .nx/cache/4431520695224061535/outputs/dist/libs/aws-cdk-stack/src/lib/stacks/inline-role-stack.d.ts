import { IRole } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { InlineRoleStackProperties } from '../types';
export declare class InlineRoleStack extends Stack {
    readonly output: {
        role: IRole;
    };
    constructor(scope: Construct, id: string, _props: InlineRoleStackProperties);
}
