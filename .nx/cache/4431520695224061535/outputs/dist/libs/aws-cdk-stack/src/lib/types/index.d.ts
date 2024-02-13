import { InstanceType, IPeer, IVpc, Port, SubnetAttributes, SubnetSelection, VpcAttributes } from 'aws-cdk-lib/aws-ec2';
import { Conditions, IRole, PrincipalBase } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { IQueue, QueueProps } from 'aws-cdk-lib/aws-sqs';
import { Duration, NestedStackProps, StackProps } from 'aws-cdk-lib/core';
import { SqsEventSourceProps } from 'aws-cdk-lib/aws-lambda-event-sources';
import { EnableScalingProps, TableProps } from 'aws-cdk-lib/aws-dynamodb';
import { CloudMapNamespaceOptions, ContainerDefinitionOptions, CpuUtilizationScalingProps, MemoryUtilizationScalingProps, MountPoint, NetworkMode, PlacementConstraint, PlacementStrategy, Volume } from 'aws-cdk-lib/aws-ecs';
import { DnsRecordType, PrivateDnsNamespaceAttributes, RoutingPolicy } from 'aws-cdk-lib/aws-servicediscovery';
import { ScalingSchedule } from 'aws-cdk-lib/aws-applicationautoscaling';
import { ApplicationLoadBalancerRedirectConfig, ApplicationTargetGroupProps, IApplicationListener, IpAddressType, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
export interface VpcStackProperties extends StackProps {
    vpcAttributes: VpcAttributes;
    awsCredentials?: AWSCredentialsModel;
    subnets: SubnetAttributes[];
}
export interface ALBLoadBalancerProperties {
    loadBalancerName: string;
    ipAddressType: IpAddressType;
    internetFacing: boolean;
    publicSubnet1: string;
    publicSubnet2: string;
}
export interface ALBStackConfiguration {
    applicationLoadbalancerProperties: ALBLoadBalancerProperties;
    certificateArns: string[];
    redirectConfigs: ApplicationLoadBalancerRedirectConfig[];
}
export interface ALBStackProperties extends StackProps {
    applicationLoadbalancerProps: ALBLoadBalancerProperties;
    certificateArns: string[];
    redirectConfigs: ApplicationLoadBalancerRedirectConfig[];
    targetGroups: ApplicationTargetGroupConfiguration[];
    vpc: IVpc;
}
export interface ApplicationTargetGroupConfiguration {
    targetGroupName: string;
    targetType: TargetType;
    port: number;
    healthCheck: {
        path: string;
    };
    apiDomain: string;
}
export interface ApplicationTargetGroupStackProperties extends StackProps {
    applicationtargetGroupProps: ApplicationTargetGroupProps;
    albListener: IApplicationListener;
    apiDomain: string;
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
    assumedBy: PrincipalBase;
    policies: PolicyStackProperties[];
}
export interface RoleStackProperties extends StackProps {
    name: string;
    assumedBy: PrincipalBase[];
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
};
export type SQSConfiguration = StackProps & {
    sqs: QueueProps[];
};
export interface ServerlessApplicationStackConfiguration extends NestedStackProps {
    executionRole: InlineRoleStackProperties;
    lambda: LambdaStackConfiguration[];
}
export interface ServerlessApplicationStackProperties extends ServerlessApplicationStackConfiguration {
    vpc: IVpc;
    subnets: SubnetSelection;
    role: IRole;
}
export declare enum EsInstanceType {
    Small = "t3.small.elasticsearch",
    Medium = "t3.medium.elasticsearch",
    Large = "r5.large.elasticsearch",
    Xlarge = "r5.xlarge.elasticsearch"
}
export interface ElasticsearchStackConfiguration extends StackProps {
    esInstanceType?: EsInstanceType | string;
    securityGroupIds?: string[];
    isProduction?: boolean;
    domainName: string;
}
export interface ElasticsearchStackProperties extends ElasticsearchStackConfiguration {
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
export interface AuroraServerlessDbStackProperties extends AuroraServerlessDbStackConfiguration {
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
    };
    sqsEventSource?: {
        queue?: IQueue;
        properties: SqsEventSourceProps;
    };
}
export declare class Tag {
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
    tables: {
        name: string;
        definition: TableProps;
    }[];
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
export interface IApplicationStackEnvironmentConfig {
    stackName: string;
    region: string;
    stage: string;
    _app: string;
    _isProduction: boolean;
    sqs?: QueueProps[];
    elasticSearch?: ElasticsearchStackConfiguration;
    serverless?: ServerlessApplicationStackConfiguration;
    aurora?: AuroraServerlessDbStackConfiguration;
    readonlyReplica?: DatabaseReadOnlyReplicaConfiguration;
}
export interface IApplicationConfigurationBuilder {
    stackName: string;
    region: string;
    stage: string;
    _app: string;
    _isProduction: boolean;
    sqs?: QueueProps[];
    serverless?: ServerlessApplicationStackConfiguration;
}
export interface BaseConfigurationBuilderOption {
    builderName: string;
}
export interface SqsConfigurationBuilderOption extends BaseConfigurationBuilderOption {
    queueName: string;
    visibilityTimeout: number;
}
export interface LambdaConfigurationBuilderOption extends BaseConfigurationBuilderOption {
    securityGroupIds: string[];
    handler: string;
    memmorySize: number;
    timeout: number;
    name: string;
    eventProperties?: EventSourceProperties;
}
export interface ServerlessConfigurationBuilderOption extends BaseConfigurationBuilderOption {
    lambdaFunctions: LambdaConfigurationBuilderOption[];
}
export interface IECSStackEnvironmentConfig extends StackProps {
    route53Domain: string;
    applicationLoadBalancer?: ALBStackConfiguration;
    applicationLoadBalancerArn?: string;
    apiprefix: string;
    app: string;
    stage: string;
    awsCredentials: AWSCredentialsModel;
    vpc: VpcStackProperties;
    ecs: ECSModel;
    service: ECSServiceModel[];
    tag: TagModel[];
    s3MountConfig?: S3MountConfig;
}
export declare abstract class ECSStackEnvironmentConfig {
    static readonly token: unique symbol;
}
export declare class RoleModel {
    name: string;
    assumedBy: PrincipalBase[];
}
export declare class AutoScalingGroupModel {
    launchTemplate: {
        name: string;
        imageId?: string;
        instanceType: string;
        keyName: string;
        version: number | string;
        volumeType: string;
        volumeSize: number;
    };
    asg: {
        name: string;
        min: string;
        max: string;
        desired: string;
        overrides: any[];
        onDemandBaseCapacity: number;
        onDemandPercentage: number;
        protectionFromScaleIn: boolean;
        instanceProfileName: string;
        instanceSecurityGroup: SecurityGroupsModel;
    };
}
declare class SecurityGroupsInboudRuleModel {
    peer: IPeer;
    connection: Port;
}
declare class SecurityGroupsModel {
    name: string;
    inboudRule: SecurityGroupsInboudRuleModel[];
}
declare class PolicyStatementModel {
    actions: string[];
    resources: string[];
    conditions?: Conditions;
}
export declare class PolicyModel {
    statements?: PolicyStatementModel[];
    statement?: PolicyStatementModel;
    name: string;
}
export declare class ECSModel {
    instancePolicy: PolicyModel;
    instanceRole: RoleModel;
    taskExecutionRolePolicy: PolicyModel;
    taskExecutionRole: RoleModel;
    taskRolePolicy: PolicyModel;
    taskRole: RoleModel;
    asgList: AutoScalingGroupModel[];
    clusterName: string;
    defaultServiceDiscoveryNamespace?: PrivateDnsNamespaceAttributes;
    defaultCloudMapNamespace?: CloudMapNamespaceOptions;
    isWindows?: boolean;
    providerList: string[];
    existingCluster?: boolean;
}
export declare class ECSServiceModel {
    cpu?: number;
    memory?: number;
    networkMode?: NetworkMode;
    taskDefinition: TaskDefinitionModel;
    name: string;
    desired?: number;
    minHealthyPercent: number;
    placementStrategy?: PlacementStrategy[];
    placementConstraint: PlacementConstraint[];
    targetGroupArn?: string;
    targetGroupNetworkArn?: string;
    applicationtargetGroup?: ApplicationTargetGroupConfiguration;
    serviceDiscoveryNamespace?: ServiceAttributesProps;
    scaleProps?: EnableScalingProps;
    cpuScalingProps?: CpuUtilizationScalingProps;
    memScalingProps?: MemoryUtilizationScalingProps;
    scaleOnScheduleList?: ScalingSchduleModel[];
    stepScaling?: string;
    daemon?: boolean;
    capacityProviderName: string;
}
declare class ScalingSchduleModel {
    id: string;
    props: ScalingSchedule;
}
export interface ServiceAttributesProps {
    readonly serviceName: string;
    readonly serviceId: string;
    readonly serviceArn: string;
    readonly dnsRecordType: DnsRecordType;
    readonly routingPolicy: RoutingPolicy;
}
declare class TaskDefinitionModel {
    name: string;
    user?: string;
    volume?: Volume[];
    containerDefinitionOptions: ContainerDefinitionOptions | ContainerDefinitionOptions[];
    mountPoints?: ContainerMountPoints[];
    isLogs?: boolean;
    logsRetention?: number;
    logsPrefix?: string;
    logGroupName?: string;
    secrets?: ContainerSecrets[];
    cpu?: string;
    memory?: string;
}
interface ContainerMountPoints {
    mounts: MountPoint[];
}
interface ContainerSecrets {
    [secretName: string]: string;
}
export declare class TagModel {
    key: string;
    value: string;
}
export declare class S3MountConfig {
    bucketName: string;
    localPath: string;
}
export {};