import { Construct, Duration, Stack, StackProps } from '@aws-cdk/core';
import {
  ApplicationListenerRule,
  ApplicationTargetGroup,
  IApplicationLoadBalancer,
  IApplicationTargetGroup,
  INetworkTargetGroup,
  ITargetGroup,
  ListenerCondition,
  NetworkTargetGroup,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { logger } from '@nx/devkit';
import { CnameRecord, HostedZone } from '@aws-cdk/aws-route53';
import { Ec2Service } from '@aws-cdk/aws-ecs';
import { ApplicationTargetGroupConfiguration, ECSServiceModel } from '../types';
import { IVpc } from '@aws-cdk/aws-ec2';

export interface ServiceALBAdapterProperties extends StackProps {
  alb: IApplicationLoadBalancer;
  serviceConfiguration: ECSServiceModel;
  applicationtargetGroup: ApplicationTargetGroupConfiguration;
  stage: string;
  route53Domain: string;
  vpc: IVpc;
  tg: ITargetGroup;
}

export class ServiceALBAdapter extends Stack {
  public tg: ITargetGroup;
  constructor(
    scope: Construct,
    id: string,
    stackProps: ServiceALBAdapterProperties
  ) {
    super(scope, id, stackProps);

    // logger.info(`route53Domain:${stackProps.route53Domain}`)
    // const _zone = HostedZone.fromLookup(this, `zone-${stackProps.stage}`, { domainName: stackProps.route53Domain });
    // new CnameRecord(this, `${stackProps.serviceConfiguration.name}-record`, {
    //     zone: _zone,
    //     recordName: `${stackProps.serviceConfiguration.apiDomain}`,
    //     domainName: stackProps.alb.loadBalancerDnsName,
    //     ttl: Duration.seconds(300)
    // });
  }
}
