import { Construct, Stack } from '@aws-cdk/core';
import { ALBStackProperties } from '../types';
import { logger } from '@nrwl/devkit';
import { ApplicationLoadBalancer, ListenerAction } from '@aws-cdk/aws-elasticloadbalancingv2';
import { v4 } from 'uuid';
import { Certificate, ICertificate } from '@aws-cdk/aws-certificatemanager';

const short = require('short-uuid');
export class ApplicationLoadBalancerStack extends Stack {
  public readonly lb: ApplicationLoadBalancer;
  constructor(scope: Construct, id: string, _props: ALBStackProperties) {
    super(scope, id, _props);
    logger.info('setting up application load balancer');
    if(!_props.applicationLoadbalancerProps.loadBalancerName)
      logger.warn('loadbalancer name is not set!');
      _props.applicationLoadbalancerProps = { ..._props.applicationLoadbalancerProps , loadBalancerName: short.generate() }

    this.lb = new ApplicationLoadBalancer(this, `alb-${_props.applicationLoadbalancerProps.loadBalancerName}`, _props.applicationLoadbalancerProps);
    const httpsListener = this.lb.addListener('listener-default', { port: 443 });
    const certs: ICertificate[] = [];
    _props.certificateArns.forEach((certificateArn, index) => {
      certs.push(Certificate.fromCertificateArn(this,`domainCert-${index}`, certificateArn));
    })
    httpsListener.addCertificates('cert', certs);

    httpsListener.addAction('defaultAction', {action: ListenerAction.fixedResponse(404)})
    _props.redirectConfigs.forEach(conf => {
      this.lb.addRedirect(conf)
    })
  }
}
