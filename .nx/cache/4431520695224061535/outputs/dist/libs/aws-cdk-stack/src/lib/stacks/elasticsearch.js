"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchStack = void 0;
const cdk = require("aws-cdk-lib/core");
const iam = require("aws-cdk-lib/aws-iam");
const es = require("aws-cdk-lib/aws-elasticsearch");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const types_1 = require("../types");
const devkit_1 = require("@nx/devkit");
class ElasticsearchStack extends cdk.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        this.templateOptions.description = 'To create elasticsearch instance';
        devkit_1.logger.info(`Initiating ElasticsearchStack ${_props.domainName}`);
        const securityGroups = _props.securityGroupIds.map((secgroupId) => aws_ec2_1.SecurityGroup.fromSecurityGroupId(this, `${id}-${secgroupId}-sg`, secgroupId));
        devkit_1.logger.info(`finished fetching security groups`);
        const esDomain = new es.Domain(this, `${id}-es-domain`, {
            domainName: _props.domainName,
            version: es.ElasticsearchVersion.V7_9,
            capacity: {
                dataNodes: 2,
                dataNodeInstanceType: _props.esInstanceType,
            },
            ebs: {
                volumeSize: _props.esInstanceType === types_1.EsInstanceType.Small ? 100 : 150,
            },
            accessPolicies: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    principals: [new iam.AnyPrincipal()],
                    actions: ['es:ESHttpGet', 'es:ESHttpPost'],
                }),
            ],
            vpc: _props.vpc,
            vpcSubnets: _props.esInstanceType === types_1.EsInstanceType.Small
                ? [_props.subnets[0]]
                : _props.subnets,
            securityGroups: securityGroups,
            zoneAwareness: _props.subnets.length > 1
                ? { enabled: true, availabilityZoneCount: _props.subnets.length }
                : { enabled: false },
        });
        this.output = { domainArn: esDomain.domainArn };
        devkit_1.logger.info('🚀');
    }
}
exports.ElasticsearchStack = ElasticsearchStack;
//# sourceMappingURL=elasticsearch.js.map