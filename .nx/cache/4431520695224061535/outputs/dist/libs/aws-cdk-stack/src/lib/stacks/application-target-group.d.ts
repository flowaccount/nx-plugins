import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ApplicationTargetGroupStackProperties } from '../types';
import { ApplicationListenerRule, ApplicationTargetGroup } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
export declare class ApplicationTargetGroupStack extends Stack {
    readonly tg: ApplicationTargetGroup;
    readonly applicationListenerRule: ApplicationListenerRule;
    constructor(scope: Construct, id: string, _props: ApplicationTargetGroupStackProperties);
}
