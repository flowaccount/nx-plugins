import { Stack, StackProps, Construct, Tags } from '@aws-cdk/core'
import { Cluster, TaskDefinition, Compatibility, NetworkMode, Ec2Service, ContainerDefinition, ContainerImage, LogDrivers, AwsLogDriverMode, Secret, AssociateCloudMapServiceOptions, ScalableTaskCount, ContainerDefinitionOptions } from '@aws-cdk/aws-ecs'
import { IVpc } from '@aws-cdk/aws-ec2';
import { IRole } from '@aws-cdk/aws-iam';
import { logger } from '@nrwl/devkit';
import { ECSModel, ECSServiceModel, TagModel } from '../types';
import { LogGroup } from '@aws-cdk/aws-logs';
import { PrivateDnsNamespace, Service } from '@aws-cdk/aws-servicediscovery';
import * as ssm from '@aws-cdk/aws-secretsmanager'
import { ApplicationTargetGroup, IApplicationTargetGroup, INetworkTargetGroup, NetworkTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
interface ECSServiceProps extends StackProps {
  readonly vpc: IVpc
  readonly cluster: Cluster
  readonly executionRole: IRole
  readonly taskRole: IRole
  readonly ecs?: ECSModel
  readonly ecsServiceList: ECSServiceModel[]
  readonly taglist: TagModel[]
}

export class ECSService extends Stack {
    constructor(scope: Construct, id: string, stackProps: ECSServiceProps) {
      super(scope, id, stackProps)
      logger.info("start creating the ecs service");
      let _taskDefinition: TaskDefinition
      let _container: ContainerDefinition
      let _service: Ec2Service
      let _tg: IApplicationTargetGroup
      let _scalableTaskCount: ScalableTaskCount
      let _tgn: INetworkTargetGroup
      logger.info("fetching cluster from attributes")

      const defaultServiceDiscoveryNamespace = PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(this, `${stackProps.ecs.clusterName}-default-service-discovery`, stackProps.ecs.defaultServiceDiscoveryNamespace );
      const _cluster = Cluster.fromClusterAttributes(this, `${stackProps.ecs.clusterName}-ecs-cluster`, {
        vpc: stackProps.vpc,
        securityGroups: [],
        clusterName: stackProps.cluster.clusterName,
        defaultCloudMapNamespace: defaultServiceDiscoveryNamespace
    })
    stackProps.ecsServiceList.forEach(s => {
      logger.info("instantiaing task defenitions")
        _taskDefinition = new TaskDefinition(this, s.taskDefinition.name, {
            compatibility: Compatibility.EC2,
            executionRole: stackProps.executionRole,
            taskRole: stackProps.taskRole,
            networkMode: s.networkMode ? s.networkMode : NetworkMode.NAT,
            cpu: `${s.cpu}`,
            memoryMiB: `${s.memory}`,
            volumes: s.taskDefinition.volume
        })

        const containerDefinitionOptions: ContainerDefinitionOptions[] = s.taskDefinition.containerDefinitionOptions.constructor.name == "Array" ? s.taskDefinition.containerDefinitionOptions as ContainerDefinitionOptions[] : [ s.taskDefinition.containerDefinitionOptions as ContainerDefinitionOptions ];

        let ccount = 0
        containerDefinitionOptions.forEach(containerOption => {
          const environment = {}
          if(containerOption.environment){
            Object.keys(containerOption.environment).forEach((k,v) => {
              environment[k] = containerOption.environment[k].toString()
            })
          }
          const secrets = {}
          if(s.taskDefinition.secrets && s.taskDefinition.secrets[ccount]){
            Object.keys(s.taskDefinition.secrets[ccount]).forEach( (k) => {
              secrets[k] = Secret.fromSecretsManager(ssm.Secret.fromSecretAttributes(this, `secret-${k}`, {secretArn: `${ s.taskDefinition.secrets[ccount][k]}` }))
            })
          }

          if(s.taskDefinition.isLogs) {
            const loggingObj = LogDrivers.awsLogs({
              logGroup: s.taskDefinition.logGroupName ?
              LogGroup.fromLogGroupName(this, containerOption.hostname, s.taskDefinition.logGroupName)
              : new LogGroup(this, containerOption.hostname, {
                logGroupName: containerOption.hostname,
                retention: s.taskDefinition.logsRetention ? s.taskDefinition.logsRetention : 1
              }),
              streamPrefix: s.taskDefinition.logsPrefix ? s.taskDefinition.logsPrefix : containerOption.hostname,
              mode: AwsLogDriverMode.NON_BLOCKING
            })
            containerOption = {...containerOption, environment: environment, secrets: secrets, logging: loggingObj }
         }

          _container = _taskDefinition.addContainer(`${s.taskDefinition.name}-container`, containerOption)
          logger.info("add Port Mappings")
          containerOption.portMappings.forEach(_pm => {
              _container.addPortMappings(_pm)
          })
          logger.info("creating mountPoints")
          if( s.taskDefinition.mountPoints && s.taskDefinition.mountPoints[ccount]) {
            _container.addMountPoints(...s.taskDefinition.mountPoints[ccount].mounts)
          }
          ccount++
        });

        logger.info("creating the sergvice itself")
        _service = new Ec2Service(this, s.name, {
              serviceName: s.name,
              cluster: _cluster,
              taskDefinition: _taskDefinition,
              assignPublicIp: false,
              desiredCount: s.desired,
              minHealthyPercent: s.minHealthyPercent,
              daemon: s.daemon
              // cloudMapOptions: cloudMapOptions
        })
        if(s.serviceDiscoveryNamespace) {
          let cloudMapOptions: AssociateCloudMapServiceOptions = null;
          const service = Service.fromServiceAttributes(this, `${s.name}-cloudmap-service`, {
            namespace: defaultServiceDiscoveryNamespace,
            ...s.serviceDiscoveryNamespace,
          })
          cloudMapOptions = {
            service: service
          };
          _service.associateCloudMapService(cloudMapOptions)
        }

        if(s.scaleProps) {
          logger.info("add scale task")
          _scalableTaskCount = _service.autoScaleTaskCount(s.scaleProps)
        }
        if(s.cpuScalingProps) {
          logger.info("add cpu scaling")
          _scalableTaskCount.scaleOnCpuUtilization(`${s.name}-cpu-auto-scale`, s.cpuScalingProps)
        }
        if(s.memScalingProps) {
          logger.info("add memory scaling")
          _scalableTaskCount.scaleOnMemoryUtilization(`${s.name}-mem-auto-scale`, s.memScalingProps)
        }
        if(s.scaleOnScheduleList) {
          logger.info("add schedule scaling")
          s.scaleOnScheduleList.forEach(sh => {
            _scalableTaskCount.scaleOnSchedule(sh.id, sh.props)
          })
        }
        if(s.placementStrategy) {
          logger.info("add the placement strategies")
          s.placementStrategy.forEach(_ps => {
            _service.addPlacementStrategies(_ps)
          });
        }
        logger.info("add the placement constraints")
        s.placementConstraint.forEach(_pc => {
          _service.addPlacementConstraints(_pc)
        });
        if(s.targetGroupArn) {
          _tg = ApplicationTargetGroup.fromTargetGroupAttributes(this, `${s.name}-tg`, {
            targetGroupArn: s.targetGroupArn
          })

          logger.info("attaching the target group")
          _service.attachToApplicationTargetGroup(_tg)
       }
       if(s.targetGroupNetworkArn) {
        _tgn = NetworkTargetGroup.fromTargetGroupAttributes(this, `${s.name}-network-tg`, {
          targetGroupArn: s.targetGroupNetworkArn
        })
        logger.info("attaching the target group")
        _service.attachToNetworkTargetGroup(_tgn)
     }
    })
    stackProps.taglist.forEach(tag => {
      Tags.of(this).add(tag.key, tag.value)
    })
  }
}
