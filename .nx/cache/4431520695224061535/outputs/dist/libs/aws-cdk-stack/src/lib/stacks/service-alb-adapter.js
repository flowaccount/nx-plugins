"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceALBAdapter = void 0;
const core_1 = require("aws-cdk-lib/core");
class ServiceALBAdapter extends core_1.Stack {
    constructor(scope, id, stackProps) {
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
exports.ServiceALBAdapter = ServiceALBAdapter;
//# sourceMappingURL=service-alb-adapter.js.map