"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationLoadBalancerStack = void 0;
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
const aws_elasticloadbalancingv2_1 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const aws_certificatemanager_1 = require("aws-cdk-lib/aws-certificatemanager");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
class ApplicationLoadBalancerStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        devkit_1.logger.info('setting up application load balancer');
        if (!_props.applicationLoadbalancerProps.loadBalancerName) {
            devkit_1.logger.warn('loadbalancer name is not set!');
            _props.applicationLoadbalancerProps = Object.assign(Object.assign({}, _props.applicationLoadbalancerProps), { loadBalancerName: Math.random().toString(36).substring(2, 5) });
        }
        const publicSubnet1 = aws_ec2_1.Subnet.fromSubnetId(this, 'stagingPublicSubnetVpc1', _props.applicationLoadbalancerProps.publicSubnet1);
        const publicSubnet2 = aws_ec2_1.Subnet.fromSubnetId(this, 'stagingPblicSubnetVpc2', _props.applicationLoadbalancerProps.publicSubnet2);
        this.lb = new aws_elasticloadbalancingv2_1.ApplicationLoadBalancer(this, `alb-${_props.applicationLoadbalancerProps.loadBalancerName}`, Object.assign(Object.assign({}, _props.applicationLoadbalancerProps), { vpc: _props.vpc, ipAddressType: _props.applicationLoadbalancerProps.ipAddressType, loadBalancerName: _props.applicationLoadbalancerProps.loadBalancerName, vpcSubnets: { subnets: [publicSubnet1, publicSubnet2] }, internetFacing: _props.applicationLoadbalancerProps.internetFacing }));
        // const httpListener = this.lb.addListener('listener-default', { port: 80 });
        const httpsListener = this.lb.addListener('listener-ssl-default', {
            port: 443,
        });
        const certs = [];
        _props.certificateArns.forEach((certificateArn, index) => {
            certs.push(aws_certificatemanager_1.Certificate.fromCertificateArn(this, `domainCert-${index}`, certificateArn));
        });
        httpsListener.addCertificates('cert', certs);
        // httpListener.addAction('defaultAction', {action: ListenerAction.fixedResponse(404)})
        httpsListener.addAction('defaultSSLAction', {
            action: aws_elasticloadbalancingv2_1.ListenerAction.fixedResponse(404),
        });
        _props.redirectConfigs.forEach((conf) => {
            this.lb.addRedirect(conf);
        });
        _props.targetGroups.forEach((tgConfig, index) => {
            if (!tgConfig.targetGroupName) {
                devkit_1.logger.warn('loadbalancer name is not set!');
                tgConfig = Object.assign(Object.assign({}, tgConfig), { targetGroupName: Math.random().toString(36).substring(2, 5) });
            }
            const tg = new aws_elasticloadbalancingv2_1.ApplicationTargetGroup(this, `tg-${tgConfig.targetGroupName}`, Object.assign(Object.assign({}, tgConfig), { vpc: _props.vpc }));
            const applicationListenerRule = new aws_elasticloadbalancingv2_1.ApplicationListenerRule(this, `${tgConfig.apiDomain}-listener-rule`, {
                listener: httpsListener,
                priority: index + 1,
                conditions: [aws_elasticloadbalancingv2_1.ListenerCondition.hostHeaders([tgConfig.apiDomain])],
                targetGroups: [tg],
            });
        });
    }
}
exports.ApplicationLoadBalancerStack = ApplicationLoadBalancerStack;
//# sourceMappingURL=application-load-balancer.js.map