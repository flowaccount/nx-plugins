import { Stack, StackProps, Construct, Tags } from '@aws-cdk/core'
import { Cluster, TaskDefinition, Compatibility, NetworkMode, Ec2Service, ContainerDefinition, ContainerImage } from '@aws-cdk/aws-ecs'
import { IVpc } from '@aws-cdk/aws-ec2';
import { IRole } from '@aws-cdk/aws-iam';
import { logger } from '@nrwl/devkit';
import { ApplicationTargetGroup, IApplicationTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
import { ECSServiceModel, TagModel } from '../types';

interface ECSServiceProps extends StackProps {
  readonly vpc: IVpc
  readonly cluster: Cluster
  readonly executionRole: IRole
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
      logger.info("fetching cluster from attributes")
      const _cluster = Cluster.fromClusterAttributes(this, 'ecs-cluster', { 
          vpc: stackProps.vpc,
          securityGroups: [],
          clusterName: stackProps.cluster.clusterName
      })
      stackProps.ecsServiceList.forEach(s => {
        logger.info("instantiaing task defenitions")
          _taskDefinition = new TaskDefinition(this, s.taskDefinition.name, {
              compatibility: Compatibility.EC2,
              executionRole: stackProps.executionRole,
              taskRole: stackProps.executionRole,
              networkMode: s.networkMode ? s.networkMode : NetworkMode.NAT,
              cpu: `${s.cpu}`,
              memoryMiB: `${s.memory}`,
              volumes: s.taskDefinition.volume
          })
          _container = _taskDefinition.addContainer(`${s.taskDefinition.name}-container`, {
            image: ContainerImage.fromRegistry(s.taskDefinition.containerDefinitionOptions.image),
            memoryLimitMiB: s.taskDefinition.containerDefinitionOptions.memoryLimitMiB,
            cpu: s.taskDefinition.containerDefinitionOptions.cpu,
            hostname: s.taskDefinition.containerDefinitionOptions.hostname,
            environment: {
              GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: s.taskDefinition.containerDefinitionOptions.environment ? (s.taskDefinition.containerDefinitionOptions.environment.GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS ? s.taskDefinition.containerDefinitionOptions.environment.GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS : undefined) : undefined
            }
          })
          logger.info("add Port Mappings")
          s.taskDefinition.portMapping.forEach(_pm => {
              _container.addPortMappings(_pm)
          })
          logger.info("creating mountPoints")
          if( s.taskDefinition.mountPoints) {
            s.taskDefinition.mountPoints.forEach(_mp => {
                _container.addMountPoints(_mp)
            })
          }
          logger.info("creating the sergvice itself")
          _service = new Ec2Service(this, s.name, {
                serviceName: s.name,
                cluster: _cluster,
                taskDefinition: _taskDefinition,
                assignPublicIp: false,
                desiredCount: s.desired,
                minHealthyPercent: s.minHealthyPercent
          })

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
      })

      stackProps.taglist.forEach(tag => {
        Tags.of(this).add(tag.key, tag.value)
      })
    }
}
