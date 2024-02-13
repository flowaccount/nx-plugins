import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ALBStackProperties } from '../types';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
export declare class ApplicationLoadBalancerStack extends Stack {
    readonly lb: ApplicationLoadBalancer;
    constructor(scope: Construct, id: string, _props: ALBStackProperties);
}
