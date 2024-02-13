import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Cluster } from 'aws-cdk-lib/aws-ecs';
import { CfnAutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import { ECSModel, S3MountConfig, TagModel, AutoScalingGroupModel } from '../types';
interface ECSAutoScalingGroupProps extends StackProps {
    readonly vpc: IVpc;
    readonly cluster: Cluster;
    readonly ecsModel: ECSModel;
    readonly asgModel: AutoScalingGroupModel;
    readonly taglist: TagModel[];
    readonly s3MountConfig: S3MountConfig;
    readonly instanceRole: IRole;
}
export declare class ECSAutoScalingGroup extends Stack {
    readonly _autoScalingGroup: CfnAutoScalingGroup;
    constructor(scope: Construct, id: string, stackProps: ECSAutoScalingGroupProps);
}
export {};
