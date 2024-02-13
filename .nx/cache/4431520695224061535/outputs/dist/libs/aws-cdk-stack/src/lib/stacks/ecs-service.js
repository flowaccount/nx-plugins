"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECSService = void 0;
const core_1 = require("aws-cdk-lib/core");
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const devkit_1 = require("@nx/devkit");
const aws_logs_1 = require("aws-cdk-lib/aws-logs");
const aws_servicediscovery_1 = require("aws-cdk-lib/aws-servicediscovery");
const ssm = require("aws-cdk-lib/aws-secretsmanager");
const aws_elasticloadbalancingv2_1 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
class ECSService extends core_1.Stack {
    constructor(scope, id, stackProps) {
        super(scope, id, stackProps);
        devkit_1.logger.info('start creating the ecs service');
        let _taskDefinition;
        let _container;
        let _scalableTaskCount;
        devkit_1.logger.info('fetching cluster from attributes');
        let defaultServiceDiscoveryNamespace = null;
        if (stackProps.ecs.defaultServiceDiscoveryNamespace) {
            defaultServiceDiscoveryNamespace =
                aws_servicediscovery_1.PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(this, `${stackProps.ecs.clusterName}-default-service-discovery`, stackProps.ecs.defaultServiceDiscoveryNamespace);
        }
        const _cluster = aws_ecs_1.Cluster.fromClusterAttributes(this, `${stackProps.ecs.clusterName}-ecs-cluster`, {
            vpc: stackProps.vpc,
            securityGroups: [],
            clusterName: stackProps.cluster.clusterName,
            defaultCloudMapNamespace: defaultServiceDiscoveryNamespace,
        });
        const s = stackProps.ecsService;
        devkit_1.logger.info('instantiaing task defenitions');
        _taskDefinition = new aws_ecs_1.TaskDefinition(this, s.taskDefinition.name, {
            compatibility: aws_ecs_1.Compatibility.EC2,
            executionRole: stackProps.executionRole,
            taskRole: stackProps.taskRole,
            networkMode: s.networkMode ? s.networkMode : aws_ecs_1.NetworkMode.NAT,
            cpu: s.taskDefinition.cpu,
            memoryMiB: s.taskDefinition.memory,
            volumes: s.taskDefinition.volume,
        });
        const containerDefinitionOptions = s.taskDefinition.containerDefinitionOptions.constructor.name == 'Array'
            ? s.taskDefinition
                .containerDefinitionOptions
            : [
                s.taskDefinition
                    .containerDefinitionOptions,
            ];
        let ccount = 0;
        containerDefinitionOptions.forEach((containerOption) => {
            const environment = {};
            if (containerOption.environment) {
                Object.keys(containerOption.environment).forEach((k, v) => {
                    environment[k] = containerOption.environment[k].toString();
                });
            }
            const secrets = {};
            if (s.taskDefinition.secrets && s.taskDefinition.secrets[ccount]) {
                Object.keys(s.taskDefinition.secrets[ccount]).forEach((k) => {
                    secrets[k] = aws_ecs_1.Secret.fromSecretsManager(ssm.Secret.fromSecretAttributes(this, `${containerOption.hostname}-secret-${k}`, { secretCompleteArn: `${s.taskDefinition.secrets[ccount][k]}` }));
                });
            }
            if (s.taskDefinition.isLogs) {
                const loggingObj = aws_ecs_1.LogDrivers.awsLogs({
                    logGroup: s.taskDefinition.logGroupName
                        ? aws_logs_1.LogGroup.fromLogGroupName(this, containerOption.hostname, s.taskDefinition.logGroupName)
                        : new aws_logs_1.LogGroup(this, containerOption.hostname, {
                            logGroupName: containerOption.hostname,
                            retention: s.taskDefinition.logsRetention
                                ? s.taskDefinition.logsRetention
                                : 1,
                        }),
                    streamPrefix: s.taskDefinition.logsPrefix
                        ? s.taskDefinition.logsPrefix
                        : containerOption.hostname,
                    mode: aws_ecs_1.AwsLogDriverMode.NON_BLOCKING,
                });
                containerOption = Object.assign(Object.assign({}, containerOption), { environment: environment, secrets: secrets, logging: loggingObj });
            }
            _container = _taskDefinition.addContainer(`${containerOption.hostname}-container`, containerOption);
            devkit_1.logger.info('add Port Mappings');
            // containerOption.portMappings.forEach((_pm) => {
            //   _container.addPortMappings(_pm);
            // });
            devkit_1.logger.info('creating mountPoints');
            if (s.taskDefinition.mountPoints &&
                s.taskDefinition.mountPoints[ccount] &&
                s.taskDefinition.mountPoints[ccount].mounts.length > 0) {
                _container.addMountPoints(...s.taskDefinition.mountPoints[ccount].mounts);
            }
            ccount++;
        });
        devkit_1.logger.info('creating the sergvice itself');
        this.service = new aws_ecs_1.Ec2Service(this, s.name, {
            serviceName: s.name,
            cluster: _cluster,
            taskDefinition: _taskDefinition,
            assignPublicIp: false,
            desiredCount: s.desired,
            minHealthyPercent: s.minHealthyPercent,
            daemon: s.daemon,
            capacityProviderStrategies: [
                {
                    capacityProvider: s.capacityProviderName,
                    weight: 1,
                },
            ],
            // cloudMapOptions: cloudMapOptions
        });
        if (s.serviceDiscoveryNamespace) {
            let cloudMapOptions = null;
            const service = aws_servicediscovery_1.Service.fromServiceAttributes(this, `${s.name}-cloudmap-service`, Object.assign({ namespace: defaultServiceDiscoveryNamespace }, s.serviceDiscoveryNamespace));
            cloudMapOptions = {
                service: service,
            };
            this.service.associateCloudMapService(cloudMapOptions);
        }
        if (s.scaleProps) {
            devkit_1.logger.info('add scale task');
            _scalableTaskCount = this.service.autoScaleTaskCount(s.scaleProps);
        }
        if (s.cpuScalingProps) {
            devkit_1.logger.info('add cpu scaling');
            _scalableTaskCount.scaleOnCpuUtilization(`${s.name}-cpu-auto-scale`, s.cpuScalingProps);
        }
        if (s.memScalingProps) {
            devkit_1.logger.info('add memory scaling');
            _scalableTaskCount.scaleOnMemoryUtilization(`${s.name}-mem-auto-scale`, s.memScalingProps);
        }
        if (s.scaleOnScheduleList) {
            devkit_1.logger.info('add schedule scaling');
            s.scaleOnScheduleList.forEach((sh) => {
                _scalableTaskCount.scaleOnSchedule(sh.id, sh.props);
            });
        }
        if (s.placementStrategy) {
            devkit_1.logger.info('add the placement strategies');
            s.placementStrategy.forEach((_ps) => {
                this.service.addPlacementStrategies(_ps);
            });
        }
        devkit_1.logger.info('add the placement constraints');
        s.placementConstraint.forEach((_pc) => {
            this.service.addPlacementConstraints(_pc);
        });
        if (s.targetGroupArn) {
            this.tg = aws_elasticloadbalancingv2_1.ApplicationTargetGroup.fromTargetGroupAttributes(this, `${s.name}-tg`, {
                targetGroupArn: s.targetGroupArn,
            });
            devkit_1.logger.info('attaching the target group');
            this.service.attachToApplicationTargetGroup(this.tg);
        }
        else if (s.targetGroupNetworkArn) {
            this.tg = aws_elasticloadbalancingv2_1.NetworkTargetGroup.fromTargetGroupAttributes(this, `${s.name}-network-tg`, {
                targetGroupArn: s.targetGroupNetworkArn,
            });
            devkit_1.logger.info('attaching the target group');
            this.service.attachToNetworkTargetGroup(this.tg);
        }
        stackProps.taglist.forEach((tag) => {
            core_1.Tags.of(this).add(tag.key, tag.value);
        });
    }
}
exports.ECSService = ECSService;
//# sourceMappingURL=ecs-service.js.map