import 'reflect-metadata';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { App } from 'aws-cdk-lib/core';
import { logger } from '@nx/devkit';
import { ECSAutoScalingGroup } from './ecs-autoscaling-group';
import { ECSCluster } from './ecs-cluster';
import { ECSService } from './ecs-service';
import { ECSCapacityProvider } from './ecs-capacity-provider';
import { ManagedPolicyStack } from './managed-policy-stack';
import { RoleStack } from './role-stack';
import { VpcStack } from './vpc';
import {
  IECSStackEnvironmentConfig,
  PolicyModel,
  PolicyStackProperties,
  PolicyStatementModel,
  TagModel,
} from '../types';

/**
 * This class is used to create an ECS cluster stack by specifying the VPC and Subnets
 * In this class it creates the Roles and policy provided in the configurations.
 * The configuration must be provided in the registry of the interface IECSStackEnvironmentConfig
 * Please register it like this
 * import { AwsECSCluster } from '@flowaccount/aws-cdk-stack'
 * import { environment } from './environments/environment'
 * import { App } from 'aws-cdk-lib/core'
 * const app = new App()
 * const awsEcsCluster = new AwsECSCluster(app, `${environment.app}-ecs-cluster`, { ...environment, env: environment.awsCredentials } )
 *
 * P.S. please mind that within the stacks, `env: configuration.awsCredentials` has to be passed into the sub-stacks properties
 * this is to make sure they can use each other and also not fail.
 */
// @injectable()
// export class AwsECSCluster { //  extends Stack

export const createStack = (configuration: IECSStackEnvironmentConfig) => {
  const _app: App = new App();
  const _autoScalingGroupList: ECSAutoScalingGroup[] = [];
  const _services: ECSService[] = [];

  logger.info(`Initiating AwsECSCluster for ${configuration.app}`);

  if (
    !configuration.applicationLoadBalancer &&
    !configuration.applicationLoadBalancerArn
  ) {
    throw Error(
      'you must specify at least a loadbalancer config or an existing ARN'
    );
  }

  // Loadbalancer vpc and route53
  const _vpc: VpcStack = new VpcStack(
    _app,
    `vpc-${configuration.app}-${configuration.stage}`,
    {
      ...configuration.vpc,
      taglist: configuration.tag,
    }
  );

  // instance role and policy
  logger.info(
    `Initiating instance role instance-role-${configuration.app}-${configuration.stage}`
  );

  const _instanceRole: IRole = new RoleStack(
    _app,
    `instance-role-${configuration.app}-${configuration.stage}`,
    {
      name: configuration.ecs.instanceRole.name,
      assumedBy: configuration.ecs.instanceRole.assumedBy,
      existingRole: configuration.ecs.instanceRole.existingRole ?? false,
      taglist: configuration.tag,
    }
  ).output.role;

  // instance policy
  createInstancePolicy(
    _app,
    configuration.ecs.instancePolicy.name,
    configuration.ecs.instancePolicy,
    [_instanceRole],
    configuration.stage
  );

  // task execution role and policy
  const _taskExecutionRole: IRole = new RoleStack(
    _app,
    `task-execution-role-${configuration.app}-${configuration.stage}`,
    {
      name: configuration.ecs.taskExecutionRole.name,
      assumedBy: configuration.ecs.taskExecutionRole.assumedBy,
      taglist: configuration.tag,
    }
  ).output.role;

  // task execution policy
  new ManagedPolicyStack(
    _app,
    `${configuration.ecs.taskExecutionRolePolicy.name}`,
    {
      ...configuration.ecs.taskExecutionRolePolicy,
      roles: [_taskExecutionRole],
      taglist: configuration.tag,
    }
  ).output.policy;

  // task role and policy
  const _taskRole: IRole = new RoleStack(
    _app,
    `task-role-${configuration.app}-${configuration.stage}`,
    {
      name: configuration.ecs.taskRole.name,
      assumedBy: configuration.ecs.taskRole.assumedBy,
      existingRole: configuration.ecs.existingCluster ?? false,
      taglist: configuration.tag,
    }
  ).output.role;

  // task policy
  new ManagedPolicyStack(_app, `${configuration.ecs.taskRolePolicy.name}`, {
    ...configuration.ecs.taskRolePolicy,
    roles: [_taskRole],
    taglist: configuration.tag,
  }).output.policy;

  // ECS Cluster and Auto Scaling Group
  const _ecs: ECSCluster = new ECSCluster(
    _app,
    `cluster-${configuration.app}-${configuration.stage}`,
    {
      ecs: configuration.ecs,
      vpc: _vpc.vpc,
      taglist: configuration.tag,
      env: configuration.awsCredentials,
    }
  );

  configuration.ecs.asgList.forEach((asg) => {
    const tempasg = new ECSAutoScalingGroup(_app, `stack-${asg.asg.name}`, {
      ecsModel: configuration.ecs,
      asgModel: asg,
      instanceRole: _instanceRole,
      vpc: _vpc.vpc,
      cluster: _ecs.cluster,
      taglist: configuration.tag,
      env: configuration.awsCredentials,
      s3MountConfig: configuration.s3MountConfig,
    });
    _autoScalingGroupList.push(tempasg);
  });

  // capacity provider
  new ECSCapacityProvider(_app, `${configuration.ecs.clusterName}-provider`, {
    ecs: configuration.ecs,
    taglist: configuration.tag,
  });

  configuration.service.forEach((apiService, index) => {
    const service = new ECSService(_app, `${apiService.name}`, {
      ecsService: apiService,
      ecs: configuration.ecs,
      taskRole: _taskRole,
      executionRole: _taskExecutionRole,
      vpc: _vpc.vpc,
      cluster: _ecs.cluster,
      stage: configuration.stage,
      taglist: configuration.tag,
      env: configuration.awsCredentials,
    });

    _services.push(service);

    // Call our new stack to tie things up together.
    // Before code was here, now it goes in here.

    // WHY new stack? Because some resource like Listeners cannot exists outside stack/scope
    // BUT When exists in the same scope/stack as Service it dies because of cross reference.
    // That is why new stack

    //   const serviceALBadapter = new ServiceALBAdapter(_app, `adapter-${apiService.name}`, {
    //    alb: _alb,
    //    tg: service.tg,
    //    serviceConfiguration: apiService,
    //    applicationtargetGroup: apiService.applicationtargetGroup,
    //    stage: configuration.stage,
    //    route53Domain: configuration.route53Domain,
    //    vpc: _vpc.vpc,
    //    env: configuration.awsCredentials
    //   })
  });
};

const createInstancePolicy = (
  app: App,
  instancePolicyName: string,
  extendedPolicy: PolicyModel,
  instanceRoles?: IRole[],
  stage?: string,
  taglist?: TagModel[]
) => {
  const ec2Policy: PolicyStatementModel = {
    actions: [
      'ec2:DescribeInstances',
      'ec2:DescribeRegions',
      'ec2:DescribeSecurityGroups',
      'ec2:DescribeSubnets',
      'ec2:DescribeVpcs',
    ],
    resources: ['*'],
  };

  const ssmPolicy: PolicyStatementModel = {
    actions: [
      'ssm:DescribeAssociation',
      'ssm:GetDeployablePatchSnapshotForInstance',
      'ssm:GetDocument',
      'ssm:DescribeDocument',
      'ssm:GetManifest',
      'ssm:GetParameter',
      'ssm:GetParameters',
      'ssm:ListAssociations',
      'ssm:ListInstanceAssociations',
      'ssm:PutInventory',
      'ssm:PutComplianceItems',
      'ssm:PutConfigurePackageResult',
      'ssm:UpdateAssociationStatus',
      'ssm:UpdateInstanceAssociationStatus',
      'ssm:UpdateInstanceInformation',
      `ssmmessages:CreateControlChannel`,
      `ssmmessages:CreateDataChannel`,
      `ssmmessages:OpenControlChannel`,
      `ssmmessages:OpenDataChannel`,
      `ec2messages:AcknowledgeMessage`,
      `ec2messages:DeleteMessage`,
      `ec2messages:FailMessage`,
      `ec2messages:GetEndpoint`,
      `ec2messages:GetMessages`,
      `ec2messages:SendReply`,
    ],
    resources: ['*'],
  };

  const statements: PolicyStatementModel[] = [ec2Policy, ssmPolicy];
  statements.push(...extendedPolicy.statements);

  const instancePolicyProps: PolicyStackProperties = {
    statements: statements,
    name: extendedPolicy.name
      ? extendedPolicy.name
      : `default-${stage}-cluster-policy`,
    roles: instanceRoles,
  };

  return new ManagedPolicyStack(app, instancePolicyName, {
    ...instancePolicyProps,
    taglist: taglist,
  }).output.policy;
};
