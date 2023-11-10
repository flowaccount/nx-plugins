import { Construct, Stack } from '@aws-cdk/core';
import { ALBStackProperties } from '../types';
import { logger } from '@nx/devkit';
import {
  ApplicationListenerRule,
  ApplicationLoadBalancer,
  ApplicationTargetGroup,
  ListenerAction,
  ListenerCondition,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { Certificate, ICertificate } from '@aws-cdk/aws-certificatemanager';
import { Subnet } from '@aws-cdk/aws-ec2';

export class ApplicationLoadBalancerStack extends Stack {
  public readonly lb: ApplicationLoadBalancer;
  constructor(scope: Construct, id: string, _props: ALBStackProperties) {
    super(scope, id, _props);
    logger.info('setting up application load balancer');
    if (!_props.applicationLoadbalancerProps.loadBalancerName) {
      logger.warn('loadbalancer name is not set!');
      _props.applicationLoadbalancerProps = {
        ..._props.applicationLoadbalancerProps,
        loadBalancerName: Math.random().toString(36).substring(2, 5),
      };
    }

    const publicSubnet1 = Subnet.fromSubnetId(
      this,
      'stagingPublicSubnetVpc1',
      _props.applicationLoadbalancerProps.publicSubnet1
    );
    const publicSubnet2 = Subnet.fromSubnetId(
      this,
      'stagingPblicSubnetVpc2',
      _props.applicationLoadbalancerProps.publicSubnet2
    );
    this.lb = new ApplicationLoadBalancer(
      this,
      `alb-${_props.applicationLoadbalancerProps.loadBalancerName}`,
      {
        ..._props.applicationLoadbalancerProps,
        vpc: _props.vpc,
        ipAddressType: _props.applicationLoadbalancerProps.ipAddressType,
        loadBalancerName: _props.applicationLoadbalancerProps.loadBalancerName,
        vpcSubnets: { subnets: [publicSubnet1, publicSubnet2] },
        internetFacing: _props.applicationLoadbalancerProps.internetFacing,
      }
    );
    // const httpListener = this.lb.addListener('listener-default', { port: 80 });
    const httpsListener = this.lb.addListener('listener-ssl-default', {
      port: 443,
    });
    const certs: ICertificate[] = [];
    _props.certificateArns.forEach((certificateArn, index) => {
      certs.push(
        Certificate.fromCertificateArn(
          this,
          `domainCert-${index}`,
          certificateArn
        )
      );
    });
    httpsListener.addCertificates('cert', certs);
    // httpListener.addAction('defaultAction', {action: ListenerAction.fixedResponse(404)})
    httpsListener.addAction('defaultSSLAction', {
      action: ListenerAction.fixedResponse(404),
    });
    _props.redirectConfigs.forEach((conf) => {
      this.lb.addRedirect(conf);
    });

    _props.targetGroups.forEach((tgConfig, index) => {
      if (!tgConfig.targetGroupName) {
        logger.warn('loadbalancer name is not set!');
        tgConfig = {
          ...tgConfig,
          targetGroupName: Math.random().toString(36).substring(2, 5),
        };
      }
      const tg = new ApplicationTargetGroup(
        this,
        `tg-${tgConfig.targetGroupName}`,
        { ...tgConfig, vpc: _props.vpc }
      );
      const applicationListenerRule = new ApplicationListenerRule(
        this,
        `${tgConfig.apiDomain}-listener-rule`,
        {
          listener: httpsListener,
          priority: index + 1,
          conditions: [ListenerCondition.hostHeaders([tgConfig.apiDomain])],
          targetGroups: [tg],
        }
      );
    });
  }
}
