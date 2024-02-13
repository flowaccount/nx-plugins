import {
  DatabaseInstance,
  DatabaseInstanceReadReplica,
  IDatabaseInstance,
} from 'aws-cdk-lib/aws-rds';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { DatabaseReadonlyReplicaProps } from '../types';
import { logger } from '@nx/devkit';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';

export class RdsReadReplicaStack extends Stack {
  public readonly output: {
    readReplica: DatabaseInstanceReadReplica;
    instance: IDatabaseInstance;
  };
  constructor(
    scope: Construct,
    id: string,
    _props: DatabaseReadonlyReplicaProps
  ) {
    super(scope, id, _props);
    logger.info(`creating database instance from attributes:${id}`);
    logger.info('Getting Security Groups');
    const securityGroups = _props.instanceAttributes.securityGroupIds.map(
      (secgroupId) =>
        SecurityGroup.fromSecurityGroupId(
          this,
          `${id}-${secgroupId}-sg`,
          secgroupId
        )
    );
    const _instance = DatabaseInstance.fromDatabaseInstanceAttributes(
      this,
      `${id}-${_props.instanceAttributes.instanceIdentifier}`,
      {
        instanceIdentifier: _props.instanceAttributes.instanceIdentifier,
        instanceEndpointAddress:
          _props.instanceAttributes.instanceEndpointAddress,
        port: _props.instanceAttributes.port,
        securityGroups: securityGroups,
      }
    );
    logger.info(`creating database read replica:${id}-read-replica:`);
    const readReplica = new DatabaseInstanceReadReplica(
      this,
      `${id}-read-replica-instance`,
      {
        sourceDatabaseInstance: _instance,
        instanceType: _props.instanceType,
        storageEncrypted: _props.production ? true : false,
        vpc: _props.vpc,
      }
    );
    this.output = {
      readReplica: readReplica,
      instance: _instance,
    };
  }
}
