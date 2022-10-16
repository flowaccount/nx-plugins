import { Stack, StackProps, Construct, Fn, Tags } from '@aws-cdk/core';
import {
  IVpc,
  CfnLaunchTemplate,
  SecurityGroup,
  SubnetType,
} from '@aws-cdk/aws-ec2';
import { CfnInstanceProfile, IRole } from '@aws-cdk/aws-iam';
import { CfnCapacityProvider, Cluster, EcsOptimizedImage, WindowsOptimizedVersion } from '@aws-cdk/aws-ecs';
import { CfnAutoScalingGroup } from '@aws-cdk/aws-autoscaling';
import { ECSModel, S3MountConfig, TagModel, AutoScalingGroupModel } from '../types';

interface ECSAutoScalingGroupProps extends StackProps {
  readonly vpc: IVpc;
  readonly cluster: Cluster;
  readonly ecsModel: ECSModel;
  readonly asgModel: AutoScalingGroupModel;
  readonly taglist: TagModel[];
  readonly s3MountConfig: S3MountConfig;
  readonly instanceRole: IRole;
}

export class ECSAutoScalingGroup extends Stack {
  public readonly _autoScalingGroup : CfnAutoScalingGroup
  public readonly capacityProvider : CfnCapacityProvider;
  constructor(
    scope: Construct,
    id: string,
    stackProps: ECSAutoScalingGroupProps
  ) {
    super(scope, id, stackProps);
    let _userData = `
        #!/bin/bash
        echo ECS_CLUSTER=${stackProps.cluster.clusterName} >> /etc/ecs/ecs.config
        echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
        docker plugin install rexray/ebs EBS_REGION=${stackProps.env.region} --grant-all-permissions
        `;
      if(stackProps.s3MountConfig) {
          _userData +=
          _userData +
          `
            sudo yum update -y
            sudo yum -y install python-pip
            sudo pip install s3cmd
            mkdir ${stackProps.s3MountConfig.localPath}
            sudo s3cmd sync s3://${stackProps.s3MountConfig.bucketName} ${stackProps.s3MountConfig.localPath}
            { sudo crontab -l; sudo echo "* * * * * sudo s3cmd sync s3://${stackProps.s3MountConfig.bucketName} ${stackProps.s3MountConfig.localPath}"; } | sudo crontab -
            `;
    }

    if(stackProps.ecsModel.isWindows) {
      _userData = `
        <powershell>
        [Environment]::SetEnvironmentVariable("ECS_ENABLE_AWSLOGS_EXECUTIONROLE_OVERRIDE", $TRUE, "Machine")
        [Environment]::SetEnvironmentVariable("ECS_ENABLE_CONTAINER_METADATA", $TRUE, "Machine")
        [Environment]::SetEnvironmentVariable("ECS_ENABLE_MEMORY_UNBOUNDED_WINDOWS_WORKAROUND", $TRUE, "Machine")
        Import-Module ECSTools
        Initialize-ECSAgent -Cluster '${stackProps.cluster.clusterName}' -EnableTaskIAMRole
        </powershell>
        `
    }
    const _securityGroup = new SecurityGroup(
      this,
      stackProps.asgModel.asg.instanceSecurityGroup.name,
      {
        vpc: stackProps.vpc,
        allowAllOutbound: true,
        securityGroupName: stackProps.asgModel.asg.instanceSecurityGroup.name,
      }
    );
    stackProps.asgModel.asg.instanceSecurityGroup.inboudRule.forEach((_rule) => {
      _securityGroup.addIngressRule(_rule.peer, _rule.connection);
    });
    const _instanceProfile = new CfnInstanceProfile(
      this,
      stackProps.asgModel.asg.instanceProfileName,
      {
        roles: [stackProps.instanceRole.roleName],
        instanceProfileName: stackProps.asgModel.asg.instanceProfileName,
      }
    );
    let _launchTemplate: CfnLaunchTemplate;
    // let this._autoScalingGroup: CfnAutoScalingGroup;
    // stackProps.ecs.asgList.forEach((asg) => {
      _launchTemplate = new CfnLaunchTemplate(this, stackProps.asgModel.launchTemplate.name, {
        launchTemplateName: stackProps.asgModel.launchTemplate.name,
        launchTemplateData: {
          imageId: stackProps.ecsModel.isWindows ?  EcsOptimizedImage.windows(WindowsOptimizedVersion.SERVER_2019).getImage(this).imageId: EcsOptimizedImage.amazonLinux2().getImage(this).imageId,
          instanceType: stackProps.asgModel.launchTemplate.instanceType,
          keyName: stackProps.asgModel.launchTemplate.keyName,
          securityGroupIds: [_securityGroup.securityGroupId],
          iamInstanceProfile: { arn: _instanceProfile.attrArn },
          userData: Fn.base64(_userData),
        },
      });
      const asgGroup = new CfnAutoScalingGroup(this, `cfn-${stackProps.asgModel.asg.name}`, {
        minSize: stackProps.asgModel.asg.min,
        maxSize: stackProps.asgModel.asg.max,
        desiredCapacity: stackProps.asgModel.asg.desired,
        autoScalingGroupName: stackProps.asgModel.asg.name,
        vpcZoneIdentifier: stackProps.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE,
        }).subnetIds,
      });
      console.log('--------------------------------', asgGroup)
      asgGroup.addPropertyOverride(
        'NewInstancesProtectedFromScaleIn',
        stackProps.asgModel.asg.protectionFromScaleIn
      );
      asgGroup.addPropertyOverride(
        'LaunchConfigurationName',
        undefined
      );
      asgGroup.addPropertyOverride(`MixedInstancesPolicy`, {
        LaunchTemplate: {
          LaunchTemplateSpecification: {
            LaunchTemplateName: _launchTemplate.launchTemplateName,
            Version: stackProps.asgModel.launchTemplate.version,
          },
          Overrides: stackProps.asgModel.asg.overrides,
        },
        InstancesDistribution: {
          OnDemandAllocationStrategy: 'prioritized',
          OnDemandBaseCapacity: stackProps.asgModel.asg.onDemandBaseCapacity,
          OnDemandPercentageAboveBaseCapacity: stackProps.asgModel.asg.onDemandPercentage,
          SpotAllocationStrategy: 'capacity-optimized',
        },
      });
      asgGroup.addDependsOn(_launchTemplate);
      this._autoScalingGroup = asgGroup;
    // });

    stackProps.taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });

      // ECS Cluster and Auto Scaling Group
    this.capacityProvider = new CfnCapacityProvider(this, `${asgGroup.autoScalingGroupName}`, {
      autoScalingGroupProvider: {
        autoScalingGroupArn: asgGroup.autoScalingGroupName,
        // the properties below are optional
        managedScaling: {
        //   instanceWarmupPeriod: 123,
        //   maximumScalingStepSize: 123,
        //   minimumScalingStepSize: 123,
        //   status: 'status',
          targetCapacity: 90,
        },
        managedTerminationProtection: 'ENABLED',
      },
      // the properties below are optional
      name: `${asgGroup.autoScalingGroupName}-cp`,
      // tags: [{
      //   key: 'key',
      //   value: 'value',
      // }],
    });
  }
}
