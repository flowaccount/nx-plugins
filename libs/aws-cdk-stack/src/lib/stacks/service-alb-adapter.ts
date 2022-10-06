import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import { ApplicationTargetGroupStackProperties } from '../types';
import { ApplicationListener, ApplicationListenerRule, ApplicationTargetGroup, IApplicationLoadBalancer, IApplicationTargetGroup, INetworkTargetGroup, ITargetGroup, ListenerCondition, NetworkTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
import { logger } from '@nrwl/devkit';
import { CnameRecord, HostedZone } from '@aws-cdk/aws-route53';
import { Ec2Service } from '@aws-cdk/aws-ecs';
import { IVpc } from '@aws-cdk/aws-ec2';

export interface ServiceALBAdapterProperties extends StackProps {
    alb: IApplicationLoadBalancer,
    readonly apiDomain: string,
    readonly targetGroupName: string,
    readonly targetGroupArn: string,
    readonly targetGroupNetworkArn: string,
    applicationtargetGroup: ApplicationTargetGroup,
    readonly  name: string,
    readonly vpc: IVpc;        
    readonly albListener: ApplicationListener;
    readonly targetGroup?: ITargetGroup;
    readonly priority: number
    readonly route53Domain?: string
    readonly stage?: string
    readonly apiprefix?: string
    readonly loadBalancerDnsName?: string
  }

export class ServiceALBAdapter extends Stack {
    public service: Ec2Service;
    public tg: ITargetGroup;
  constructor(scope: Construct, id: string, s: ServiceALBAdapterProperties) {
    super(scope, id, s);
      // start moving code from here
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
          this.service.attachToApplicationTargetGroup(<IApplicationTargetGroup>tg);
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
          this.service.attachToNetworkTargetGroup(<INetworkTargetGroup>tg);
        }
        else {
          if(!s.applicationtargetGroup.targetGroupName)
            s.applicationtargetGroup = { ...s.applicationtargetGroup , targetGroupName: Math.random().toString(36).substring(2, 5) }
          tg = new ApplicationTargetGroup(this, `tg-${s.applicationtargetGroup.targetGroupName}`, { ...s.applicationtargetGroup, vpc: s.vpc  });
          // tg = new ApplicationTargetGroupStack(
          //   this
          //   , `${s.name}-tg-${stackProps.stage}`
          //   , { applicationtargetGroupProps : { ...s.applicationtargetGroup, vpc: stackProps.vpc  },
          //   env: stackProps.env
          //  }).tg;
        }
      }
    s.applicationtargetGroup = tg
    if(tg) {
      logger.info(`apiDomain:${s.apiDomain}`)
        const applicationListenerRule = new ApplicationListenerRule(this, `${s.name}-listener-rule`, {
          listener: s.albListener, //.find( l => l.connections.defaultPort == ),
          priority: s.priority,
          conditions: [ListenerCondition.hostHeaders([s.apiDomain])],
          targetGroups: [<IApplicationTargetGroup>this.tg]
      });
      if(s.targetGroupNetworkArn)
      {
        throw new Error("Not Implemented");
      }
      else {
        // stackProps.albListener.addTargetGroups(`${s.name}-tgs-${stackProps.stage}`, { targetGroups: [<IApplicationTargetGroup>this.tg] });
      }
      var _zone = HostedZone.fromLookup(this, `zone-${s.stage}`, { domainName: s.route53Domain });
      new CnameRecord(this, `${s.name}-record`, {
          zone: _zone,
          recordName: `${s.apiprefix}-${s.name}`,
          domainName: s.loadBalancerDnsName,
          ttl: Duration.seconds(300) 
      });
    } 
    // to here
  }
}
