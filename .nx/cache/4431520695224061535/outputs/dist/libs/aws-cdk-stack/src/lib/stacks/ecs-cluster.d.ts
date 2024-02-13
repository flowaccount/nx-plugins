import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ECSModel, TagModel } from '../types';
interface ECSClusterProps extends StackProps {
    readonly vpc: IVpc;
    readonly ecs: ECSModel;
    readonly taglist: TagModel[];
}
export declare class ECSCluster extends Stack {
    readonly cluster: Cluster;
    readonly executionRole: IRole;
    constructor(scope: Construct, id: string, stackProps: ECSClusterProps);
}
export {};
