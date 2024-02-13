"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECSAutoScalingGroup = void 0;
//backup ecs-autoscaling-group.ts
const core_1 = require("aws-cdk-lib/core");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const aws_autoscaling_1 = require("aws-cdk-lib/aws-autoscaling");
class ECSAutoScalingGroup extends core_1.Stack {
    constructor(scope, id, stackProps) {
        super(scope, id, stackProps);
        let _userData = `
#!/bin/bash
echo "Creating ECS Configuration File"
mkdir /etc/ecs || echo "ECS Directory Already Exists"
cat << EOF >> /etc/ecs/ecs.config
ECS_CLUSTER=${stackProps.cluster.clusterName}
ECS_ENABLE_CONTAINER_METADATA=true
EOF

amazon-linux-extras disable docker && amazon-linux-extras install -y ecs && systemctl enable --now --no-block ecs
docker plugin install rexray/ebs EBS_REGION=${stackProps.env.region} --grant-all-permissions
        `;
        if (stackProps.s3MountConfig) {
            _userData = `
#!/bin/bash
echo "Creating ECS Configuration File"
mkdir /etc/ecs || echo "ECS Directory Already Exists"
cat << EOF >> /etc/ecs/ecs.config
ECS_CLUSTER=${stackProps.cluster.clusterName}
ECS_ENABLE_CONTAINER_METADATA=true
EOF

amazon-linux-extras disable docker && amazon-linux-extras install -y ecs && systemctl enable --now --no-block ecs
docker plugin install rexray/ebs EBS_REGION=${stackProps.env.region} --grant-all-permissions
sudo yum update -y
sudo yum -y install python-pip
sudo pip install s3cmd
mkdir ${stackProps.s3MountConfig.localPath}
sudo s3cmd sync s3://${stackProps.s3MountConfig.bucketName} ${stackProps.s3MountConfig.localPath}
{ sudo crontab -l; sudo echo "* * * * * sudo s3cmd sync s3://${stackProps.s3MountConfig.bucketName} ${stackProps.s3MountConfig.localPath}"; } | sudo crontab -
          `;
        }
        if (stackProps.ecsModel.isWindows) {
            _userData = `
        <powershell>
        [Environment]::SetEnvironmentVariable("ECS_ENABLE_AWSLOGS_EXECUTIONROLE_OVERRIDE", $TRUE, "Machine")
        [Environment]::SetEnvironmentVariable("ECS_ENABLE_CONTAINER_METADATA", $TRUE, "Machine")
        [Environment]::SetEnvironmentVariable("ECS_ENABLE_MEMORY_UNBOUNDED_WINDOWS_WORKAROUND", $TRUE, "Machine")
        Import-Module ECSTools
        Initialize-ECSAgent -Cluster '${stackProps.cluster.clusterName}' -EnableTaskIAMRole
        </powershell>
        `;
        }
        const _securityGroup = new aws_ec2_1.SecurityGroup(this, stackProps.asgModel.asg.instanceSecurityGroup.name, {
            vpc: stackProps.vpc,
            allowAllOutbound: true,
            securityGroupName: stackProps.asgModel.asg.instanceSecurityGroup.name,
        });
        stackProps.asgModel.asg.instanceSecurityGroup.inboudRule.forEach((_rule) => {
            _securityGroup.addIngressRule(_rule.peer, _rule.connection);
        });
        const _instanceProfile = new aws_iam_1.CfnInstanceProfile(this, stackProps.asgModel.asg.instanceProfileName, {
            roles: [stackProps.instanceRole.roleName],
            instanceProfileName: stackProps.asgModel.asg.instanceProfileName,
        });
        let _launchTemplate;
        const amazonLinux = new aws_ec2_1.AmazonLinuxImage({});
        _launchTemplate = new aws_ec2_1.CfnLaunchTemplate(this, stackProps.asgModel.launchTemplate.name, {
            launchTemplateName: stackProps.asgModel.launchTemplate.name,
            launchTemplateData: {
                imageId: stackProps.ecsModel.isWindows ? aws_ecs_1.EcsOptimizedImage.windows(aws_ecs_1.WindowsOptimizedVersion.SERVER_2019).getImage(this).imageId : stackProps.asgModel.launchTemplate.imageId,
                instanceType: stackProps.asgModel.launchTemplate.instanceType,
                keyName: stackProps.asgModel.launchTemplate.keyName,
                securityGroupIds: [_securityGroup.securityGroupId],
                iamInstanceProfile: { arn: _instanceProfile.attrArn },
                userData: core_1.Fn.base64(_userData),
                blockDeviceMappings: [{
                        ebs: {
                            volumeType: stackProps.asgModel.launchTemplate.volumeType,
                            volumeSize: stackProps.asgModel.launchTemplate.volumeSize,
                            deleteOnTermination: true
                        },
                        deviceName: "/dev/xvda"
                    }],
            },
        });
        const asgGroup = new aws_autoscaling_1.CfnAutoScalingGroup(this, `cfn-${stackProps.asgModel.asg.name}`, {
            minSize: stackProps.asgModel.asg.min,
            maxSize: stackProps.asgModel.asg.max,
            desiredCapacity: stackProps.asgModel.asg.desired,
            autoScalingGroupName: stackProps.asgModel.asg.name,
            vpcZoneIdentifier: stackProps.vpc.selectSubnets({
                subnetType: aws_ec2_1.SubnetType.PRIVATE,
            }).subnetIds,
        });
        console.log('--------------------------------', asgGroup);
        asgGroup.addPropertyOverride('NewInstancesProtectedFromScaleIn', stackProps.asgModel.asg.protectionFromScaleIn);
        asgGroup.addPropertyOverride('LaunchConfigurationName', undefined);
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
            core_1.Tags.of(this).add(tag.key, tag.value);
        });
        // ECS Cluster and Auto Scaling Group
        console.log(asgGroup.autoScalingGroupName);
        // let protection: string = stackProps.asgModel.asg.protectionFromScaleIn==true? 'ENABLED': 'DISABLED'
        let protection;
        console.log(stackProps.asgModel.asg.protectionFromScaleIn);
        if (stackProps.asgModel.asg.protectionFromScaleIn) {
            protection = 'ENABLED';
        }
        else {
            protection = 'DISABLED';
        }
        console.log(protection);
        const myCapacityProvider = new aws_ecs_1.CfnCapacityProvider(this, `${asgGroup.autoScalingGroupName}`, {
            autoScalingGroupProvider: {
                autoScalingGroupArn: asgGroup.autoScalingGroupName,
                managedScaling: {
                    targetCapacity: 100,
                    status: 'ENABLED'
                },
                managedTerminationProtection: protection,
            },
            name: `${asgGroup.autoScalingGroupName}`,
        });
        myCapacityProvider.addDependsOn(asgGroup);
    }
}
exports.ECSAutoScalingGroup = ECSAutoScalingGroup;
//# sourceMappingURL=ecs-autoscaling-group.js.map