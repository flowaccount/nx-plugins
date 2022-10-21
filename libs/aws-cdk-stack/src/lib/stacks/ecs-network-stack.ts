import 'reflect-metadata'
import { IRole, ManagedPolicy } from '@aws-cdk/aws-iam';
import { App, Construct, Duration, Stack } from '@aws-cdk/core';
import { logger } from '@nrwl/devkit';
import { inject, injectable, registry } from 'tsyringe';
import { ECSAutoScalingGroup } from './ecs-autoscaling-group';
import { ECSCluster } from './ecs-cluster';
import { ECSService } from './ecs-service';
import { ManagedPolicyStack } from './managed-policy-stack';
import { RoleStack } from './role-stack';
import { VpcStack } from './vpc';
import { ApplicationTargetGroupConfiguration, IECSStackEnvironmentConfig } from '../types'
import { ApplicationListenerRule, ApplicationLoadBalancer, ApplicationTargetGroup, IApplicationLoadBalancer, IApplicationTargetGroup, INetworkTargetGroup, ITargetGroup, ListenerAction, ListenerCondition, NetworkTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
// import { Subnet, Vpc } from '@aws-cdk/aws-ec2';
// import { Certificate } from '@aws-cdk/aws-certificatemanager';
import { CnameRecord, HostedZone, IHostedZone } from '@aws-cdk/aws-route53';
import { ApplicationLoadBalancerStack } from './application-load-balancer';
import { Subnet } from '@aws-cdk/aws-ec2';
import { ApplicationTargetGroupStack } from './application-target-group';
import { Certificate, ICertificate } from '@aws-cdk/aws-certificatemanager';
import { AsgCapacityProvider, CfnCapacityProvider } from '@aws-cdk/aws-ecs';
import { CfnAutoScalingGroup } from '@aws-cdk/aws-autoscaling';
import { ServiceALBAdapter } from './service-alb-adapter';
import { config, env } from 'process';

/**
 * This class is used to create an ECS cluster stack by specifying the VPC and Subnets
 * In this class it creates the Roles and policy provided in the configurations.
 * The configuration must be provided in the registry of the interface IECSStackconfigurationConfig
 * Please register it like this
 * import { AwsECSCluster } from '@flowaccount/aws-cdk-stack'
 * import { configuration } from './configurations/configuration'
 * import { App } from '@aws-cdk/core'
 * const app = new App()
 * const awsEcsCluster = new AwsECSCluster(app, `${configuration.app}-ecs-cluster`, { ...configuration, env: configuration.awsCredentials } )
 *
 * P.S. please mind that within the stacks, `env: configuration.awsCredentials` has to be passed into the sub-stacks properties
 * this is to make sure they can use each other and also not fail.
 */
// @injectable()
// export class AwsECSCluster { //  extends Stack


  export const createNetworkStack = (configuration: IECSStackEnvironmentConfig) => {

    const app: App = new App();
    const _vpc = new VpcStack(app, `vpc-${configuration.stage}`, configuration.vpc).vpc

    const targetGroups: ApplicationTargetGroupConfiguration[] =  [];
    configuration.service.forEach((apiService, index) => {
        if(apiService.applicationtargetGroup)
        {
          targetGroups.push(apiService.applicationtargetGroup);
        }
    });

    const _alb = new ApplicationLoadBalancerStack(app, `${configuration.stage}-alb`,
    {
        applicationLoadbalancerProps: configuration.applicationLoadBalancer.applicationLoadbalancerProperties,
        redirectConfigs: configuration.applicationLoadBalancer.redirectConfigs,
        certificateArns: configuration.applicationLoadBalancer.certificateArns,
        targetGroups: targetGroups,
        vpc: _vpc,
        env: configuration.awsCredentials
    }).lb
}



