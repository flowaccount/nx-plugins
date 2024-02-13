"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuroraServerlessDbStack = void 0;
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const devkit_1 = require("@nx/devkit");
const core_1 = require("aws-cdk-lib/core");
const aws_rds_1 = require("aws-cdk-lib/aws-rds");
class AuroraServerlessDbStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        this.templateOptions.description = 'To produce sls (serverless) aurora';
        devkit_1.logger.info('Initiating Serverless RDS Cluster');
        const db = new aws_rds_1.ServerlessCluster(this, `${id}-aurora-serverless-cdk`, {
            engine: aws_rds_1.DatabaseClusterEngine.auroraPostgres({
                version: aws_rds_1.AuroraPostgresEngineVersion.VER_10_14,
            }),
            clusterIdentifier: `${id}-sls-db`,
            //parameterGroup: new rds.ParameterGroup(this, 'AuroraServerlessCdk-Param', {engine: ''}),
            defaultDatabaseName: 'audit_db',
            vpc: _props.vpc,
            vpcSubnets: _props.subnets,
            securityGroups: _props.securityGroupIds.map((secgroupId) => aws_ec2_1.SecurityGroup.fromSecurityGroupId(this, `${id}-${secgroupId}-sg`, secgroupId)),
            deletionProtection: _props.isProduction,
            enableDataApi: true,
            credentials: aws_rds_1.Credentials.fromPassword(_props.username, core_1.SecretValue.plainText(_props.password)),
        });
        this.output = { auroraArn: db.clusterArn, db: db };
        devkit_1.logger.info('🥪');
    }
}
exports.AuroraServerlessDbStack = AuroraServerlessDbStack;
//# sourceMappingURL=aurora-severless-db.js.map