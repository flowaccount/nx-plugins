import { CfnAutoScalingGroup } from '@aws-cdk/aws-autoscaling';
import { IVpc } from '@aws-cdk/aws-ec2';
import {
  CfnCapacityProvider,
  CfnClusterCapacityProviderAssociations,
  Cluster,
} from '@aws-cdk/aws-ecs';
import { IRole } from '@aws-cdk/aws-iam';
import { Stack, Construct, StackProps, Tags } from '@aws-cdk/core';
import { logger } from '@nx/devkit';
import { AutoScalingGroupModel, ECSModel, TagModel } from '../types';
import { ECSAutoScalingGroup } from './ecs-autoscaling-group';

interface ECSCapacityProviderProps extends StackProps {
  readonly ecs: ECSModel;
  readonly taglist: TagModel[];
}

export class ECSCapacityProvider extends Stack {
  public readonly thisClusterCapacityProviderAssociations: CfnClusterCapacityProviderAssociations;
  constructor(
    scope: Construct,
    id: string,
    stackProps: ECSCapacityProviderProps
  ) {
    super(scope, id, stackProps);
    logger.info('creating the ecs cluster');
    console.log(
      `=====================================================${stackProps.ecs.providerList}`
    ),
      (this.thisClusterCapacityProviderAssociations =
        new CfnClusterCapacityProviderAssociations(
          this,
          `${stackProps.ecs.clusterName}-act`,
          {
            capacityProviders: stackProps.ecs.providerList,
            cluster: stackProps.ecs.clusterName,
            defaultCapacityProviderStrategy: [
              {
                capacityProvider: `${stackProps.ecs.clusterName}-default`,
                base: 0,
                weight: 1,
              },
            ],
          }
        ));

    stackProps.taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
