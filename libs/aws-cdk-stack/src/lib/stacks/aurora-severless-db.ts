import { AuroraServerlessDbStackProperties } from '../types';
import { SecurityGroup } from '@aws-cdk/aws-ec2';
import { logger } from '@nrwl/devkit';
import { Construct, SecretValue, Stack } from '@aws-cdk/core';
import {
  AuroraPostgresEngineVersion,
  Credentials,
  DatabaseClusterEngine,
  ServerlessCluster,
} from '@aws-cdk/aws-rds';

export class AuroraServerlessDbStack extends Stack {
  public readonly output: {
    auroraArn: string;
    db: ServerlessCluster;
  };
  constructor(
    scope: Construct,
    id: string,
    _props: AuroraServerlessDbStackProperties
  ) {
    super(scope, id, _props);
    this.templateOptions.description = 'To produce sls (serverless) aurora';

    logger.info('Initiating Serverless RDS Cluster');
    const db = new ServerlessCluster(this, `${id}-aurora-serverless-cdk`, {
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_10_14,
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
      credentials: Credentials.fromPassword(
        _props.username,
        SecretValue.plainText(_props.password)
      ),
    });
    this.output = { auroraArn: db.clusterArn, db: db };
    logger.info('🥪');
  }
}
