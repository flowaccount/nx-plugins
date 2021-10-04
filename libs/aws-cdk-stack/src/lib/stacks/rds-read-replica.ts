import {
  DatabaseInstance,
  DatabaseInstanceReadReplica,
  IDatabaseInstance,
} from '@aws-cdk/aws-rds';
import { Construct, Stack } from '@aws-cdk/core';
import { DatabaseReadonlyReplicaProps } from '@flowaccount/aws-cdk-stack';
import { logger } from '@nrwl/devkit';

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
    const _instance = DatabaseInstance.fromDatabaseInstanceAttributes(
      scope,
      id,
      _props.instanceAttributes
    );
    logger.info(`creating database read replica:${id}-read-replica:`);
    const readReplica = new DatabaseInstanceReadReplica(
      this,
      `${id}-read-replica`,
      {
        sourceDatabaseInstance: _instance,
        instanceType: _props.instanceType,
        storageEncrypted: _props.production,
        vpc: _props.vpc,
      }
    );
    this.output = {
      readReplica: readReplica,
      instance: _instance,
    };
  }
}
