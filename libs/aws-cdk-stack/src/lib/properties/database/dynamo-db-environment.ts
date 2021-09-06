import { AWSCredentialsModel } from '../../models';
import { VpcReference } from '../../models';
import { Tag } from '../../models';
import { TableProps } from '@aws-cdk/aws-dynamodb';
import { StackProps } from '@aws-cdk/core';

export interface DynamoDbEnvironmentProps extends StackProps {
  production: boolean;
  app: string;
  stage: string;
  awsCredentials: AWSCredentialsModel;
  description: string;
  vpc: VpcReference;
  tag: Tag[];
  tables: { name: string; definition: TableProps }[];
}
