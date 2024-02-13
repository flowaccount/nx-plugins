import 'reflect-metadata';
import { IRole, ManagedPolicy } from '@aws-cdk/aws-iam';
import { App, Construct, Duration, Stack } from '@aws-cdk/core';
import { logger } from '@nx/devkit';
import { inject, injectable, registry } from 'tsyringe';
import { ECSAutoScalingGroup } from './ecs-autoscaling-group';
import { ECSCluster } from './ecs-cluster';
import { ECSService } from './ecs-service';
import { ECSCapacityProvider } from './ecs-capacity-provider';
import { ManagedPolicyStack } from './managed-policy-stack';
import { RoleStack } from './role-stack';
import { VpcStack } from './vpc';
import { IECSStackEnvironmentConfig } from '../types';
import {
  ApplicationListenerRule,
  ApplicationLoadBalancer,
  ApplicationTargetGroup,
  IApplicationLoadBalancer,
  IApplicationTargetGroup,
  INetworkTargetGroup,
  ITargetGroup,
  ListenerAction,
  ListenerCondition,
  NetworkTargetGroup,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { IHostedZone } from '@aws-cdk/aws-route53';

/**
 * This class is used to create an ECS cluster stack by specifying the VPC and Subnets
 * In this class it creates the Roles and policy provided in the configurations.
 * The configuration must be provided in the registry of the interface IECSStackEnvironmentConfig
 * Please register it like this
 * import { AwsECSCluster } from '@flowaccount/aws-cdk-stack'
 * import { environment } from './environments/environment'
 * import { App } from '@aws-cdk/core'
 * const app = new App()
 * const awsEcsCluster = new AwsECSCluster(app, `${environment.app}-ecs-cluster`, { ...environment, env: environment.awsCredentials } )
 *
 * P.S. please mind that within the stacks, `env: configuration.awsCredentials` has to be passed into the sub-stacks properties
 * this is to make sure they can use each other and also not fail.
 */
// @injectable()
// export class AwsECSCluster { //  extends Stack

export const createStack = (configuration: IECSStackEnvironmentConfig) => {
  let _app: App = new App();
  let _applicationLoadbalancer: ApplicationLoadBalancer;
  let _ta;
  rgetGroup: ApplicationTargetGroup;
  let _ecs: ECSCluster;
  let _cp: ECSCapacityProvider;

  let _instancePolicy: ManagedPolicy;
  let _taskPolicy: ManagedPolicy;
  let _taskExecutionRole: IRole;
  let _instanceRole: IRole;
  let _taskRole: IRole;
  let _zone: IHostedZone;
  let _taskExecutionPolicy: ManagedPolicy;
  let _vpc: VpcStack;
  let _tg: ApplicationTargetGroup;
  let _applicationListenerRule: ApplicationListenerRule;
  let _autoScalingGroupList: ECSAutoScalingGroup[] = [];
  let _services: ECSService[] = [];
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
  _vpc = new VpcStack(
    _app,
    `vpc-${configuration.app}-${configuration.stage}`,
    configuration.vpc
  );

  // Loadbalancer vpc and route53
  // instance role and policy
  logger.info(
    `Initiating instance role instance-role-${configuration.app}-${configuration.stage}`
  );
  _instanceRole = new RoleStack(
    _app,
    `instance-role-${configuration.app}-${configuration.stage}`,
    {
      name: configuration.ecs.instanceRole.name,
      assumedBy: configuration.ecs.instanceRole.assumedBy,
    }
  ).output.role;
  _instancePolicy = new ManagedPolicyStack(
    _app,
    `${configuration.ecs.instancePolicy.name}`,
    {
      ...configuration.ecs.instancePolicy,
      roles: [_instanceRole],
    }
  ).output.policy;
  // instance role and policy

  // task execution role and policy
  _taskExecutionRole = new RoleStack(
    _app,
    `task-execution-role-${configuration.app}-${configuration.stage}`,
    {
      name: configuration.ecs.taskExecutionRole.name,
      assumedBy: configuration.ecs.taskExecutionRole.assumedBy,
    }
  ).output.role;
  _taskExecutionPolicy = new ManagedPolicyStack(
    _app,
    `${configuration.ecs.taskExecutionRolePolicy.name}`,
    {
      ...configuration.ecs.taskExecutionRolePolicy,
      roles: [_taskExecutionRole],
    }
  ).output.policy;
  // task execution role and policy

  // task role and policy
  _taskRole = new RoleStack(
    _app,
    `task-role-${configuration.app}-${configuration.stage}`,
    {
      name: configuration.ecs.taskRole.name,
      assumedBy: configuration.ecs.taskRole.assumedBy,
    }
  ).output.role;
  _taskPolicy = new ManagedPolicyStack(
    _app,
    `${configuration.ecs.taskRolePolicy.name}`,
    {
      ...configuration.ecs.taskRolePolicy,
      roles: [_taskRole],
    }
  ).output.policy;
  // task role and policy

  // ECS Cluster and Auto Scaling Group
  _ecs = new ECSCluster(
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
  _cp = new ECSCapacityProvider(
    _app,
    `${configuration.ecs.clusterName}-provider`,
    {
      ecs: configuration.ecs,
      taglist: configuration.tag,
    }
  );
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
    }); //
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
