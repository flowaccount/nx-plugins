import { Stack, StackProps, Construct, Fn, Tags } from '@aws-cdk/core';
import {
  IVpc,
  CfnLaunchTemplate,
  SecurityGroup,
  SubnetType,
} from '@aws-cdk/aws-ec2';
import { CfnInstanceProfile, IRole } from '@aws-cdk/aws-iam';
import { Cluster, EcsOptimizedImage, WindowsOptimizedVersion } from '@aws-cdk/aws-ecs';
import { CfnAutoScalingGroup } from '@aws-cdk/aws-autoscaling';
import { ECSModel, S3MountConfig, TagModel } from '../types';

interface ECSAutoScalingGroupProps extends StackProps {
  readonly vpc: IVpc;
  readonly cluster: Cluster;
  readonly ecs: ECSModel;
  readonly taglist: TagModel[];
  readonly s3MountConfig: S3MountConfig;
  readonly instanceRole: IRole;
}

export class ECSAutoScalingGroup extends Stack {
  public _autoScalingGroupList : CfnAutoScalingGroup[] = []
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

    if(stackProps.ecs.isWindows) {
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
      stackProps.ecs.instanceSecurityGroup.name,
      {
        vpc: stackProps.vpc,
        allowAllOutbound: true,
        securityGroupName: stackProps.ecs.instanceSecurityGroup.name,
      }
    );
    stackProps.ecs.instanceSecurityGroup.inboudRule.forEach((_rule) => {
      _securityGroup.addIngressRule(_rule.peer, _rule.connection);
    });
    const _instanceProfile = new CfnInstanceProfile(
      this,
      stackProps.ecs.instanceProfile.name,
      {
        roles: [stackProps.instanceRole.roleName],
        instanceProfileName: stackProps.ecs.instanceProfile.name,
      }
    );
    let _launchTemplate: CfnLaunchTemplate;
    // let this._autoScalingGroup: CfnAutoScalingGroup;
    stackProps.ecs.asgList.forEach((asg) => {
      _launchTemplate = new CfnLaunchTemplate(this, asg.launchTemplate.name, {
        launchTemplateName: asg.launchTemplate.name,
        launchTemplateData: {
          imageId: stackProps.ecs.isWindows ?  EcsOptimizedImage.windows(WindowsOptimizedVersion.SERVER_2019).getImage(this).imageId: EcsOptimizedImage.amazonLinux2().getImage(this).imageId,
          instanceType: asg.launchTemplate.instanceType,
          keyName: asg.launchTemplate.keyName,
          securityGroupIds: [_securityGroup.securityGroupId],
          iamInstanceProfile: { arn: _instanceProfile.attrArn },
          userData: Fn.base64(_userData),
        },
      });
      const asgGroup = new CfnAutoScalingGroup(this, asg.asg.name, {
        minSize: asg.asg.min,
        maxSize: asg.asg.max,
        desiredCapacity: asg.asg.desired,
        autoScalingGroupName: asg.asg.name,
        vpcZoneIdentifier: stackProps.vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE,
        }).subnetIds,
      });
      asgGroup.addPropertyOverride(
        'NewInstancesProtectedFromScaleIn',
        asg.asg.protectionFromScaleIn
      );
      asgGroup.addPropertyOverride(
        'LaunchConfigurationName',
        undefined
      );
      asgGroup.addPropertyOverride(`MixedInstancesPolicy`, {
        LaunchTemplate: {
          LaunchTemplateSpecification: {
            LaunchTemplateName: _launchTemplate.launchTemplateName,
            Version: asg.launchTemplate.version,
          },
          Overrides: asg.asg.overrides,
        },
        InstancesDistribution: {
          OnDemandAllocationStrategy: 'prioritized',
          OnDemandBaseCapacity: asg.asg.onDemandBaseCapacity,
          OnDemandPercentageAboveBaseCapacity: asg.asg.onDemandPercentage,
          SpotAllocationStrategy: 'capacity-optimized',
        },
      });
      asgGroup.addDependsOn(_launchTemplate);
      this._autoScalingGroupList.push(asgGroup);
    });

    stackProps.taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
