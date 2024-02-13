import 'reflect-metadata';
import { IECSStackEnvironmentConfig } from '../types';
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
export declare const createNetworkStack: (configuration: IECSStackEnvironmentConfig) => void;
