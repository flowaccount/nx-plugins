import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { IApplicationLoadBalancer, ITargetGroup } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { ApplicationTargetGroupConfiguration, ECSServiceModel } from '../types';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
export interface ServiceALBAdapterProperties extends StackProps {
    alb: IApplicationLoadBalancer;
    serviceConfiguration: ECSServiceModel;
    applicationtargetGroup: ApplicationTargetGroupConfiguration;
    stage: string;
    route53Domain: string;
    vpc: IVpc;
    tg: ITargetGroup;
}
export declare class ServiceALBAdapter extends Stack {
    tg: ITargetGroup;
    constructor(scope: Construct, id: string, stackProps: ServiceALBAdapterProperties);
}
