import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Stack,  CfnOutput } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { DynamoDbEnvironmentProps } from '../types';

export class DynamoDbStack extends Stack {
  constructor(scope: Construct, id: string, _props: DynamoDbEnvironmentProps) {
    super(scope, id, _props);

    this.templateOptions.description = _props.description;

    _props.tables.forEach((table) => {
      const dynamoTable = new Table(this, `${table.name}`, table.definition);
      new CfnOutput(this, 'dynamoDbArn', { value: dynamoTable.tableArn });
    });
  }
}
