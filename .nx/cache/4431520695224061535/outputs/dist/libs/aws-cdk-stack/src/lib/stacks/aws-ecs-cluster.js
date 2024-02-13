"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStack = void 0;
require("reflect-metadata");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
const ecs_autoscaling_group_1 = require("./ecs-autoscaling-group");
const ecs_cluster_1 = require("./ecs-cluster");
const ecs_service_1 = require("./ecs-service");
const ecs_capacity_provider_1 = require("./ecs-capacity-provider");
const managed_policy_stack_1 = require("./managed-policy-stack");
const role_stack_1 = require("./role-stack");
const vpc_1 = require("./vpc");
const aws_elasticloadbalancingv2_1 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
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
const createStack = (configuration) => {
    let _app = new core_1.App();
    let _applicationLoadbalancer;
    let _ta;
    rgetGroup: aws_elasticloadbalancingv2_1.ApplicationTargetGroup;
    let _ecs;
    let _cp;
    let _instancePolicy;
    let _taskPolicy;
    let _taskExecutionRole;
    let _instanceRole;
    let _taskRole;
    let _zone;
    let _taskExecutionPolicy;
    let _vpc;
    let _tg;
    let _applicationListenerRule;
    let _autoScalingGroupList = [];
    let _services = [];
    devkit_1.logger.info(`Initiating AwsECSCluster for ${configuration.app}`);
    if (!configuration.applicationLoadBalancer &&
        !configuration.applicationLoadBalancerArn) {
        throw Error('you must specify at least a loadbalancer config or an existing ARN');
    }
    // Loadbalancer vpc and route53
    _vpc = new vpc_1.VpcStack(_app, `vpc-${configuration.app}-${configuration.stage}`, configuration.vpc);
    // Loadbalancer vpc and route53
    // instance role and policy
    devkit_1.logger.info(`Initiating instance role instance-role-${configuration.app}-${configuration.stage}`);
    _instanceRole = new role_stack_1.RoleStack(_app, `instance-role-${configuration.app}-${configuration.stage}`, {
        name: configuration.ecs.instanceRole.name,
        assumedBy: configuration.ecs.instanceRole.assumedBy,
    }).output.role;
    _instancePolicy = new managed_policy_stack_1.ManagedPolicyStack(_app, `${configuration.ecs.instancePolicy.name}`, Object.assign(Object.assign({}, configuration.ecs.instancePolicy), { roles: [_instanceRole] })).output.policy;
    // instance role and policy
    // task execution role and policy
    _taskExecutionRole = new role_stack_1.RoleStack(_app, `task-execution-role-${configuration.app}-${configuration.stage}`, {
        name: configuration.ecs.taskExecutionRole.name,
        assumedBy: configuration.ecs.taskExecutionRole.assumedBy,
    }).output.role;
    _taskExecutionPolicy = new managed_policy_stack_1.ManagedPolicyStack(_app, `${configuration.ecs.taskExecutionRolePolicy.name}`, Object.assign(Object.assign({}, configuration.ecs.taskExecutionRolePolicy), { roles: [_taskExecutionRole] })).output.policy;
    // task execution role and policy
    // task role and policy
    _taskRole = new role_stack_1.RoleStack(_app, `task-role-${configuration.app}-${configuration.stage}`, {
        name: configuration.ecs.taskRole.name,
        assumedBy: configuration.ecs.taskRole.assumedBy,
    }).output.role;
    _taskPolicy = new managed_policy_stack_1.ManagedPolicyStack(_app, `${configuration.ecs.taskRolePolicy.name}`, Object.assign(Object.assign({}, configuration.ecs.taskRolePolicy), { roles: [_taskRole] })).output.policy;
    // task role and policy
    // ECS Cluster and Auto Scaling Group
    _ecs = new ecs_cluster_1.ECSCluster(_app, `cluster-${configuration.app}-${configuration.stage}`, {
        ecs: configuration.ecs,
        vpc: _vpc.vpc,
        taglist: configuration.tag,
        env: configuration.awsCredentials,
    });
    configuration.ecs.asgList.forEach((asg) => {
        const tempasg = new ecs_autoscaling_group_1.ECSAutoScalingGroup(_app, `stack-${asg.asg.name}`, {
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
    _cp = new ecs_capacity_provider_1.ECSCapacityProvider(_app, `${configuration.ecs.clusterName}-provider`, {
        ecs: configuration.ecs,
        taglist: configuration.tag,
    });
    configuration.service.forEach((apiService, index) => {
        const service = new ecs_service_1.ECSService(_app, `${apiService.name}`, {
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
exports.createStack = createStack;
//# sourceMappingURL=aws-ecs-cluster.js.map