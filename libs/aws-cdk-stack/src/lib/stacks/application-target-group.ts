import { Construct, Stack } from '@aws-cdk/core';
import { ApplicationTargetGroupStackProperties } from '../types';
import { ApplicationListenerRule, ApplicationTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
import { logger } from '@nrwl/devkit';

export class ApplicationTargetGroupStack extends Stack {
  public readonly tg: ApplicationTargetGroup;
  public readonly applicationListenerRule: ApplicationListenerRule;
  constructor(scope: Construct, id: string, _props: ApplicationTargetGroupStackProperties) {
    super(scope, id, _props);

    if(!_props.applicationtargetGroupProps.targetGroupName)
      logger.warn('loadbalancer name is not set!');
      _props.applicationtargetGroupProps = { ..._props.applicationtargetGroupProps , targetGroupName: Math.random().toString(36).substring(2, 5) }

    this.tg = new ApplicationTargetGroup(this, `tg-${_props.applicationtargetGroupProps.targetGroupName}`, _props.applicationtargetGroupProps);
  }
}
