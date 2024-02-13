import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Cluster, Ec2Service, CfnCapacityProvider } from 'aws-cdk-lib/aws-ecs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { ECSModel, ECSServiceModel, TagModel } from '../types';
import { ITargetGroup } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
export interface ECSServiceProps extends StackProps {
    readonly vpc: IVpc;
    readonly cluster: Cluster;
    readonly executionRole: IRole;
    readonly taskRole: IRole;
    readonly ecs?: ECSModel;
    readonly ecsService: ECSServiceModel;
    readonly taglist: TagModel[];
    readonly stage?: string;
    readonly apiprefix?: string;
    readonly capacityProvider?: CfnCapacityProvider;
}
export declare class ECSService extends Stack {
    service: Ec2Service;
    tg: ITargetGroup;
    constructor(scope: Construct, id: string, stackProps: ECSServiceProps);
}
