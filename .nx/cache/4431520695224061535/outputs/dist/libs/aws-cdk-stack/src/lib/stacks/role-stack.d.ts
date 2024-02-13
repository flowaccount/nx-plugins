import { IRole } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { RoleStackProperties } from '../types';
export declare class RoleStack extends Stack {
    readonly output: {
        role: IRole;
    };
    constructor(scope: Construct, id: string, _props: RoleStackProperties);
}
