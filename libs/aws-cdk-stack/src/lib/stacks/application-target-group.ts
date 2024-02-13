import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ApplicationTargetGroupStackProperties } from '../types';
import {
  ApplicationListenerRule,
  ApplicationTargetGroup,
  IApplicationTargetGroup,
  ListenerCondition,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { logger } from '@nx/devkit';

export class ApplicationTargetGroupStack extends Stack {
  public readonly tg: ApplicationTargetGroup;
  public readonly applicationListenerRule: ApplicationListenerRule;
  constructor(
    scope: Construct,
    id: string,
    _props: ApplicationTargetGroupStackProperties
  ) {
    super(scope, id, _props);

    if (!_props.applicationtargetGroupProps.targetGroupName) {
      logger.warn('loadbalancer name is not set!');
      _props.applicationtargetGroupProps = {
        ..._props.applicationtargetGroupProps,
        targetGroupName: Math.random().toString(36).substring(2, 5),
      };
    }
    this.tg = new ApplicationTargetGroup(
      this,
      `tg-${_props.applicationtargetGroupProps.targetGroupName}`,
      _props.applicationtargetGroupProps
    );
    const applicationListenerRule = new ApplicationListenerRule(
      this,
      `${_props.apiDomain}-listener-rule`,
      {
        listener: _props.albListener,
        priority: 1,
        conditions: [ListenerCondition.hostHeaders([_props.apiDomain])],
        targetGroups: [this.tg],
      }
    );
  }
}
