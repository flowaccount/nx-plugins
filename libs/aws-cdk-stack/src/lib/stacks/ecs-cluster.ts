import { IVpc } from '@aws-cdk/aws-ec2';
import { CfnCapacityProvider, CfnClusterCapacityProviderAssociations, Cluster } from '@aws-cdk/aws-ecs';
import { IRole } from '@aws-cdk/aws-iam';
import { Stack, Construct, StackProps, Tags } from '@aws-cdk/core';
import { logger } from '@nrwl/devkit';
import { ECSModel, TagModel } from '../types';

interface ECSClusterProps extends StackProps {
  readonly vpc: IVpc;
  readonly ecs: ECSModel;
  readonly taglist: TagModel[];
}

export class ECSCluster extends Stack {
  readonly cluster: Cluster;
  readonly executionRole: IRole;
  readonly myClusterCapacityProviderAssociations: CfnClusterCapacityProviderAssociations;
  constructor(scope: Construct, id: string, stackProps: ECSClusterProps) {
    super(scope, id, stackProps);

    logger.info('creating the ecs cluster');

    this.cluster = new Cluster(this, stackProps.ecs.clusterName, {
      vpc: stackProps.vpc,
      clusterName: stackProps.ecs.clusterName,
      containerInsights: false,
    });

    const myCapacityProvider = new CfnCapacityProvider(this, `${stackProps.ecs.clusterName}-asg-cp`, {
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
      name:  `${stackProps.ecs.clusterName}-asg-cp`,
      // tags: [{
      //   key: 'key',
      //   value: 'value',
      // }],
    });

    this.myClusterCapacityProviderAssociations = new CfnClusterCapacityProviderAssociations(this, `${stackProps.ecs.clusterName}-capacity-provider`, {
      capacityProviders: [myCapacityProvider.name],
      cluster: stackProps.ecs.clusterName,
      defaultCapacityProviderStrategy: [{
        capacityProvider: myCapacityProvider.name,
      }],
    });

    stackProps.taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
