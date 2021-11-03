import {
  InstanceType,
  IVpc,
  SubnetAttributes,
  SubnetSelection,
  VpcAttributes,
} from '@aws-cdk/aws-ec2';
import { Conditions, IPrincipal, IRole } from '@aws-cdk/aws-iam';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as lambda from '@aws-cdk/aws-lambda';
import { IQueue, QueueProps } from '@aws-cdk/aws-sqs';
import { Duration, NestedStackProps, StackProps } from '@aws-cdk/core';
import { SqsEventSourceProps } from '@aws-cdk/aws-lambda-event-sources';
import { TableProps } from '@aws-cdk/aws-dynamodb';
import { DatabaseInstance, DatabaseInstanceAttributes } from '@aws-cdk/aws-rds';

export interface VpcStackProperties extends StackProps {
  vpcAttributes: VpcAttributes;
  awsCredentials?: AWSCredentialsModel;
  subnets: SubnetAttributes[];
}

interface PolicyStatementStackProperties {
  actions: string[];
  resources: string[];
  conditions?: Conditions;
  forceResource?: boolean;
}

export interface PolicyStackProperties extends StackProps {
  statements?: PolicyStatementStackProperties[];
  name: string;
  roles?: IRole[];
  resourceArns?: string[];
}

export interface InlineRoleStackProperties extends StackProps {
  name: string;
  assumedBy: IPrincipal;
  policies: PolicyStackProperties[];
}

export interface RoleStackProperties extends StackProps {
  name: string;
  assumedBy: IPrincipal;
  // policies: Policy[]
}

export interface InstanceProfileModel {
  name: string;
}

export interface CronOptions {
  readonly minute?: string;
  readonly hour?: string;
  readonly day?: string;
  readonly month?: string;
  readonly year?: string;
  readonly weekDay?: string;
  //https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
}

export interface AWSCredentialsModel {
  account: string;
  region: string;
}

export type EnvironmentConfig = StackProps & {
  stackName: string;
  isProduction: boolean;
  awsCredentials: AWSCredentialsModel;
  envName: string;
  vpc: VpcStackProperties;
  // sqs?: QueueProps[],
  // elasticSearch?: ElasticsearchStackConfiguration
  // serverless?: ServerlessApplicationStackConfiguration
  // aurora?: AuroraServerlessDbStackConfiguration
};

export type SQSConfiguration = StackProps & { sqs: QueueProps[] };

export interface ServerlessApplicationStackConfiguration
  extends NestedStackProps {
  executionRole: InlineRoleStackProperties;
  lambda: LambdaStackConfiguration[];
}

export interface ServerlessApplicationStackProperties
  extends ServerlessApplicationStackConfiguration {
  vpc: IVpc;
  subnets: SubnetSelection;
  role: IRole;
  // lambdaFunctions: lambda.Function[]
}
export enum EsInstanceType {
  Small = 't3.small.elasticsearch',
  Medium = 't3.medium.elasticsearch',
  Large = 'r5.large.elasticsearch',
  Xlarge = 'r5.xlarge.elasticsearch',
}

export interface ElasticsearchStackConfiguration extends StackProps {
  esInstanceType?: EsInstanceType | string;
  securityGroupIds?: string[];
  isProduction?: boolean;
  domainName: string;
}

export interface ElasticsearchStackProperties
  extends ElasticsearchStackConfiguration {
  vpc: IVpc;
  subnets: SubnetSelection[];
}

export interface AuroraServerlessDbStackConfiguration extends StackProps {
  esInstanceType?: EsInstanceType | string;
  securityGroupIds?: string[];
  isProduction?: boolean;
  username: string;
  password: string;
}

export interface AuroraServerlessDbStackProperties
  extends AuroraServerlessDbStackConfiguration {
  vpc: IVpc;
  subnets: SubnetSelection;
}

export interface LambdaStackConfiguration extends StackProps {
  runtime: Runtime;
  handler: string;
  srcRootPath: string;
  timeout: Duration;
  memorySize: number;
  environment: {
    [key: string]: string;
  };
  functionName: string;
  eventProperties?: EventSourceProperties;
  securityGroupIds: string[];
}

export interface LambdaStackProperties extends StackProps {
  vpc: IVpc;
  subnets: SubnetSelection;
  functions: LambdaStackConfiguration[];
  role?: IRole;
}

export interface LambdaEventSourceStackProperties extends StackProps {
  lambdaFunction: lambda.Function;
  eventProperties: EventSourceProperties;
}

export interface EventSourceProperties extends StackProps {
  kinesisEventSource?: {
    dataStreamArn: string;
    // stream: kinesis.IStream,
    // properties: KinesisEventSourceProps
  };
  sqsEventSource?: {
    queue: IQueue;
    properties: SqsEventSourceProps;
  };
}

export class Tag {
  key: string;
  value: string;
}

export interface DynamoDbEnvironmentProps extends StackProps {
  production: boolean;
  app: string;
  stage: string;
  awsCredentials: AWSCredentialsModel;
  description: string;
  vpc: IVpc;
  tag: Tag[];
  tables: { name: string; definition: TableProps }[];
}

type DbInstanceAttributes = {
  instanceIdentifier: string;
  instanceEndpointAddress: string;
  port: number;
  securityGroupIds: string[];
};

export interface DatabaseReadonlyReplicaProps extends StackProps {
  vpc: IVpc;
  instanceType: InstanceType;
  production: boolean;
  instanceAttributes: DbInstanceAttributes;
  awsCredentials?: AWSCredentialsModel;
}

export type DatabaseReadOnlyReplicaConfiguration = StackProps & {
  instanceType: InstanceType;
  production: boolean;
  instanceAttributes: DbInstanceAttributes;
};
