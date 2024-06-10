import 'reflect-metadata';
import { App } from 'aws-cdk-lib/core';
import { VpcStack } from './vpc';
import {
  ApplicationTargetGroupConfiguration,
  IECSStackEnvironmentConfig,
} from '../types';
// import { Subnet, Vpc } from 'aws-cdk-lib/aws-ec2';
// import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { ApplicationLoadBalancerStack } from './application-load-balancer';

/**
 * This class is used to create an ECS cluster stack by specifying the VPC and Subnets
 * In this class it creates the Roles and policy provided in the configurations.
 * The configuration must be provided in the registry of the interface IECSStackconfigurationConfig
 * Please register it like this
 * import { AwsECSCluster } from '@flowaccount/aws-cdk-stack'
 * import { configuration } from './configurations/configuration'
 * import { App } from 'aws-cdk-lib/core'
 * const app = new App()
 * const awsEcsCluster = new AwsECSCluster(app, `${configuration.app}-ecs-cluster`, { ...configuration, env: configuration.awsCredentials } )
 *
 * P.S. please mind that within the stacks, `env: configuration.awsCredentials` has to be passed into the sub-stacks properties
 * this is to make sure they can use each other and also not fail.
 */
// @injectable()
// export class AwsECSCluster { //  extends Stack

export const createNetworkStack = (
  configuration: IECSStackEnvironmentConfig
) => {
  const app: App = new App();
  const _vpc = new VpcStack(
    app,
    `vpc-${configuration.stage}`,
    configuration.vpc
  ).vpc;

  const targetGroups: ApplicationTargetGroupConfiguration[] = [];
  configuration.service.forEach((apiService, index) => {
    if (apiService.applicationtargetGroup) {
      targetGroups.push(apiService.applicationtargetGroup);
    }
  });

  const _alb = new ApplicationLoadBalancerStack(
    app,
    `${configuration.stage}-alb`,
    {
      applicationLoadbalancerProps:
        configuration.applicationLoadBalancer.applicationLoadbalancerProperties,
      redirectConfigs: configuration.applicationLoadBalancer.redirectConfigs,
      certificateArns: configuration.applicationLoadBalancer.certificateArns,
      targetGroups: targetGroups,
      vpc: _vpc,
      env: configuration.awsCredentials,
    }
  ).lb;
};
