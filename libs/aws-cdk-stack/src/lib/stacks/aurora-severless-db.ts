import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';
import { AuroraServerlessDbStackProperties } from '../types';
import { SecurityGroup } from '@aws-cdk/aws-ec2';
import { logger } from '@nrwl/devkit';

export class AuroraServerlessDbStack extends cdk.Stack {
  public readonly output: {
    auroraArn: string;
    db: rds.ServerlessCluster;
  };
  constructor(
    scope: cdk.Construct,
    id: string,
    _props: AuroraServerlessDbStackProperties
  ) {
    super(scope, id, _props);
    this.templateOptions.description = 'To produce sls (serverless) aurora';

    logger.info('Initiating RDS Cluster');
    const db = new rds.ServerlessCluster(this, `${id}-aurora-serverless-cdk`, {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_10_14,
      }),
      clusterIdentifier: `${id}-sls-db`,
      //parameterGroup: new rds.ParameterGroup(this, 'AuroraServerlessCdk-Param', {engine: ''}),
      defaultDatabaseName: 'audit_db',
      vpc: _props.vpc,
      vpcSubnets: _props.subnets,
      securityGroups: _props.securityGroupIds.map((secgroupId) =>
        SecurityGroup.fromSecurityGroupId(
          this,
          `${id}-${secgroupId}-sg`,
          secgroupId
        )
      ),
      deletionProtection: _props.isProduction,
      enableDataApi: true,
      credentials: rds.Credentials.fromPassword(
        _props.username,
        cdk.SecretValue.plainText(_props.password)
      ),
    });
    this.output = { auroraArn: db.clusterArn, db: db };
    logger.info('🥪');
  }
}
