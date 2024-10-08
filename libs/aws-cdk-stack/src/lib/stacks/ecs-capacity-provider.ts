import {
  CfnClusterCapacityProviderAssociations,
} from 'aws-cdk-lib/aws-ecs';
import { Stack,  StackProps, Tags } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { ECSModel, TagModel } from '../types';

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
