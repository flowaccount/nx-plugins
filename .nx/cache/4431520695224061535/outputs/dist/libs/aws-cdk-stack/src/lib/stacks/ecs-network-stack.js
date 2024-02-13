"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNetworkStack = void 0;
require("reflect-metadata");
const core_1 = require("aws-cdk-lib/core");
const vpc_1 = require("./vpc");
const application_load_balancer_1 = require("./application-load-balancer");
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
const createNetworkStack = (configuration) => {
    const app = new core_1.App();
    const _vpc = new vpc_1.VpcStack(app, `vpc-${configuration.stage}`, configuration.vpc).vpc;
    const targetGroups = [];
    configuration.service.forEach((apiService, index) => {
        if (apiService.applicationtargetGroup) {
            targetGroups.push(apiService.applicationtargetGroup);
        }
    });
    const _alb = new application_load_balancer_1.ApplicationLoadBalancerStack(app, `${configuration.stage}-alb`, {
        applicationLoadbalancerProps: configuration.applicationLoadBalancer.applicationLoadbalancerProperties,
        redirectConfigs: configuration.applicationLoadBalancer.redirectConfigs,
        certificateArns: configuration.applicationLoadBalancer.certificateArns,
        targetGroups: targetGroups,
        vpc: _vpc,
        env: configuration.awsCredentials,
    }).lb;
};
exports.createNetworkStack = createNetworkStack;
//# sourceMappingURL=ecs-network-stack.js.map