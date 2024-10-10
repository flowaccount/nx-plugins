import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ICluster } from 'aws-cdk-lib/aws-ecs';
import { IRole } from 'aws-cdk-lib/aws-iam';
import { Stack, StackProps, Tags } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { ECSModel, TagModel } from '../types';

interface ECSClusterProps extends StackProps {
  readonly vpc: IVpc;
  readonly ecs: ECSModel;
  readonly taglist: TagModel[];
}
export class ECSCluster extends Stack {
  readonly cluster: ICluster;
  readonly executionRole: IRole;

  constructor(scope: Construct, id: string, stackProps: ECSClusterProps) {
    super(scope, id, stackProps);

    logger.info(
      `creating the ecs cluster with existing set as : ${stackProps.ecs.existingCluster}`
    );

    if (stackProps.ecs.existingCluster) {
      this.cluster = Cluster.fromClusterAttributes(
        this,
        stackProps.ecs.clusterName,
        {
          vpc: stackProps.vpc,
          clusterName: stackProps.ecs.clusterName,
          securityGroups: [],
        }
      );
    } else {
      this.cluster = new Cluster(this, stackProps.ecs.clusterName, {
        vpc: stackProps.vpc,
        clusterName: stackProps.ecs.clusterName,
        containerInsights: false,
      });
    }

    stackProps.taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
