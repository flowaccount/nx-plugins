"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RdsReadReplicaStack = void 0;
const aws_rds_1 = require("aws-cdk-lib/aws-rds");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
class RdsReadReplicaStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        devkit_1.logger.info(`creating database instance from attributes:${id}`);
        devkit_1.logger.info('Getting Security Groups');
        const securityGroups = _props.instanceAttributes.securityGroupIds.map((secgroupId) => aws_ec2_1.SecurityGroup.fromSecurityGroupId(this, `${id}-${secgroupId}-sg`, secgroupId));
        const _instance = aws_rds_1.DatabaseInstance.fromDatabaseInstanceAttributes(this, `${id}-${_props.instanceAttributes.instanceIdentifier}`, {
            instanceIdentifier: _props.instanceAttributes.instanceIdentifier,
            instanceEndpointAddress: _props.instanceAttributes.instanceEndpointAddress,
            port: _props.instanceAttributes.port,
            securityGroups: securityGroups,
        });
        devkit_1.logger.info(`creating database read replica:${id}-read-replica:`);
        const readReplica = new aws_rds_1.DatabaseInstanceReadReplica(this, `${id}-read-replica-instance`, {
            sourceDatabaseInstance: _instance,
            instanceType: _props.instanceType,
            storageEncrypted: _props.production ? true : false,
            vpc: _props.vpc,
        });
        this.output = {
            readReplica: readReplica,
            instance: _instance,
        };
    }
}
exports.RdsReadReplicaStack = RdsReadReplicaStack;
//# sourceMappingURL=rds-read-replica.js.map