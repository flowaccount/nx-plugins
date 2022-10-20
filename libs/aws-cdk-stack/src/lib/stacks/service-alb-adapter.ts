import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import {  ApplicationListenerRule, ApplicationTargetGroup, IApplicationLoadBalancer, IApplicationTargetGroup, INetworkTargetGroup, ITargetGroup, ListenerCondition, NetworkTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
import { logger } from '@nrwl/devkit';
import { CnameRecord, HostedZone } from '@aws-cdk/aws-route53';
import { Ec2Service } from '@aws-cdk/aws-ecs';
import { ApplicationTargetGroupConfiguration, ECSServiceModel } from '../types';
import { IVpc } from '@aws-cdk/aws-ec2';

export interface ServiceALBAdapterProperties extends StackProps {
    alb: IApplicationLoadBalancer,
    service: Ec2Service,
    serviceConfiguration : ECSServiceModel,
    applicationtargetGroup: ApplicationTargetGroupConfiguration,
    stage: string,
    route53Domain: string,
    vpc: IVpc
  }

export class ServiceALBAdapter extends Stack {
    public tg: ITargetGroup;
  constructor(scope: Construct, id: string, stackProps: ServiceALBAdapterProperties) {
    super(scope, id, stackProps);
      // start moving code from here
      const s = stackProps.serviceConfiguration;
      if(s.apiDomain
        && !s.targetGroupArn
        && !s.targetGroupNetworkArn
        && !s.applicationtargetGroup)
        throw new Error("At least targetGroupArn or targetGroupNetworkArn or applicationtargetGroup must be set")
      let tg: ITargetGroup = null;
      if(s.targetGroupArn || s.targetGroupNetworkArn || s.applicationtargetGroup) {
          if (s.targetGroupArn) {
            tg = ApplicationTargetGroup.fromTargetGroupAttributes(
              this,
              `${s.name}-tg`,
              {
                targetGroupArn: s.targetGroupArn,
              }
            );
          logger.info('attaching the target group');
          stackProps.service.attachToApplicationTargetGroup(<IApplicationTargetGroup>tg);
        }
        else if (s.targetGroupNetworkArn) {
          tg = NetworkTargetGroup.fromTargetGroupAttributes(
            this,
            `${s.name}-network-tg`,
            {
              targetGroupArn: s.targetGroupNetworkArn,
            }
          );
          logger.info('attaching the target group');
          stackProps.service.attachToNetworkTargetGroup(<INetworkTargetGroup>tg);
        }
        else {
          if(!s.applicationtargetGroup.targetGroupName)
            s.applicationtargetGroup = { ...s.applicationtargetGroup , targetGroupName: Math.random().toString(36).substring(2, 5) }
          tg = new ApplicationTargetGroup(this, `tg-${s.applicationtargetGroup.targetGroupName}`, { ...s.applicationtargetGroup, vpc: stackProps.vpc  });
          // tg = new ApplicationTargetGroupStack(
          //   this
          //   , `${s.name}-tg-${stackProps.stage}`
          //   , { applicationtargetGroupProps : { ...s.applicationtargetGroup, vpc: stackProps.vpc  },
          //   env: stackProps.env
          //  }).tg;
        }
      }
    // s.applicationtargetGroup = tg
    if(tg) {
      logger.info(`apiDomain:${s.apiDomain}`)
        const applicationListenerRule = new ApplicationListenerRule(this, `${s.name}-listener-rule`, {
          listener: stackProps.alb.listeners[0], //.find( l => l.connections.defaultPort == ),
          priority: 1,
          conditions: [ListenerCondition.hostHeaders([s.apiDomain])],
          targetGroups: [<IApplicationTargetGroup>tg]
      });
      if(s.targetGroupNetworkArn)
      {
        throw new Error("Not Implemented");
      }
      else {
        // stackProps.albListener.addTargetGroups(`${s.name}-tgs-${stackProps.stage}`, { targetGroups: [<IApplicationTargetGroup>this.tg] });
      }
      logger.info(`route53Domain:${stackProps.route53Domain}`)
      const _zone = HostedZone.fromLookup(this, `zone-${stackProps.stage}`, { domainName: stackProps.route53Domain });
      new CnameRecord(this, `${s.name}-record`, {
          zone: _zone,
          recordName: `${s.apiDomain}`,
          domainName: stackProps.alb.loadBalancerDnsName,
          ttl: Duration.seconds(300)
      });
    }
    // to here
  }
}
