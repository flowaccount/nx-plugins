import { Construct, Stack } from '@aws-cdk/core';
import { ALBStackProperties } from '../types';
import { logger } from '@nrwl/devkit';
import { ApplicationLoadBalancer, ListenerAction } from '@aws-cdk/aws-elasticloadbalancingv2';
import { Certificate, ICertificate } from '@aws-cdk/aws-certificatemanager';

export class ApplicationLoadBalancerStack extends Stack {
  public readonly lb: ApplicationLoadBalancer;
  constructor(scope: Construct, id: string, _props: ALBStackProperties) {
    super(scope, id, _props);
    logger.info('setting up application load balancer');
    if(!_props.applicationLoadbalancerProps.loadBalancerName)
      logger.warn('loadbalancer name is not set!');
      _props.applicationLoadbalancerProps = { ..._props.applicationLoadbalancerProps , loadBalancerName: Math.random().toString(36).substring(2, 5) }

    this.lb = new ApplicationLoadBalancer(this, `alb-${_props.applicationLoadbalancerProps.loadBalancerName}`, _props.applicationLoadbalancerProps);
    // const httpListener = this.lb.addListener('listener-default', { port: 80 });
    const httpsListener = this.lb.addListener('listener-ssl-default', { port: 443 });
    const certs: ICertificate[] = [];
    _props.certificateArns.forEach((certificateArn, index) => {
      certs.push(Certificate.fromCertificateArn(this,`domainCert-${index}`, certificateArn));
    })
    httpsListener.addCertificates('cert', certs);
    // httpListener.addAction('defaultAction', {action: ListenerAction.fixedResponse(404)})
    httpsListener.addAction('defaultSSLAction', {action: ListenerAction.fixedResponse(404)})
    _props.redirectConfigs.forEach(conf => {
      this.lb.addRedirect(conf)
    })
  }
}
