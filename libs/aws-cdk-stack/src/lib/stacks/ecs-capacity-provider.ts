import { CfnAutoScalingGroup } from '@aws-cdk/aws-autoscaling';
import { IVpc } from '@aws-cdk/aws-ec2';
import { CfnCapacityProvider, CfnClusterCapacityProviderAssociations, Cluster } from '@aws-cdk/aws-ecs';
import { IRole } from '@aws-cdk/aws-iam';
import { Stack, Construct, StackProps, Tags } from '@aws-cdk/core';
import { logger } from '@nrwl/devkit';
import { AutoScalingGroupModel, ECSModel, TagModel } from '../types';
import { ECSAutoScalingGroup } from './ecs-autoscaling-group';

interface ECSCapacityProviderProps extends StackProps {
  // readonly vpc: IVpc;
  readonly ecs: ECSModel;
  readonly taglist: TagModel[];
  // readonly cluster: Cluster;
  // readonly _autoScalingGroup : CfnAutoScalingGroup;
}

export class ECSCapacityProvider extends Stack {
  // public readonly cluster: Cluster;
  // public readonly executionRole: IRole;
  // public readonly capacityProvider : CfnCapacityProvider;
  public readonly thisClusterCapacityProviderAssociations: CfnClusterCapacityProviderAssociations;
  constructor(scope: Construct, id: string, stackProps: ECSCapacityProviderProps) {
    super(scope, id, stackProps);
    logger.info('creating the ecs cluster');

    //------------------------------------------------------------------------
    // const myCapacityProvider = new CfnCapacityProvider(this, `${stackProps._autoScalingGroup.autoScalingGroupName}`, {
    //   autoScalingGroupProvider: {
    //     autoScalingGroupArn: stackProps._autoScalingGroup.autoScalingGroupName,
    //     // the properties below are optional
    //     managedScaling: {
    //     //   instanceWarmupPeriod: 123,
    //     //   maximumScalingStepSize: 123,
    //     //   minimumScalingStepSize: 123,
    //     //   status: 'status',
    //       targetCapacity: 90,
    //     },
    //     managedTerminationProtection: 'ENABLED',
    //   },
    //   // the properties below are optional
    //   name: `${stackProps._autoScalingGroup.autoScalingGroupName}`,
    //   // tags: [{
    //   //   key: 'key',
    //   //   value: 'value',
    //   // }],
    // });
    // myCapacityProvider.addDependsOn(stackProps._autoScalingGroup);
    // this.capacityProvider = myCapacityProvider;
    // console.log(`------------------provider---------${myCapacityProvider.name}--`)
    // console.log(`------------------asg.name---------${stackProps._autoScalingGroup.autoScalingGroupName}--`)
    console.log(`=====================================================${stackProps.ecs.providerList}`),
    this.thisClusterCapacityProviderAssociations = new CfnClusterCapacityProviderAssociations(this, `${stackProps.ecs.clusterName}-act`, {
      
      capacityProviders: stackProps.ecs.providerList,
      cluster: stackProps.ecs.clusterName,
      defaultCapacityProviderStrategy: [{
        capacityProvider: `${stackProps.ecs.clusterName}-default`,
        base: 0,
        weight: 1
      }],
    });
    // thisClusterCapacityProviderAssociations.addDependsOn(myCapacityProvider)

    //------------------------------------------------------------------------

    stackProps.taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
