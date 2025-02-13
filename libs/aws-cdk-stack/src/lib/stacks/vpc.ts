import { IVpc, Subnet, SubnetSelection, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Stack, Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TagModel, VpcStackProperties } from '../types';
import { logger } from '@nx/devkit';

export interface VpcStackProps extends VpcStackProperties {
  readonly taglist?: TagModel[];
}

export class VpcStack extends Stack {
  public readonly vpc: IVpc;
  public readonly subnetSelection: SubnetSelection;

  constructor(scope: Construct, id: string, stackProps: VpcStackProps) {
    super(scope, id, stackProps);
    logger.info('fetching vpc by its attributes');
    this.vpc = Vpc.fromVpcAttributes(
      this,
      `${id}-${stackProps.vpcAttributes.vpcId}`,
      stackProps.vpcAttributes
    );

    this.subnetSelection = {
      subnets: stackProps.subnets.map((attr, index) =>
        Subnet.fromSubnetAttributes(this, `subnet${index}`, attr)
      ),
    };

    stackProps.taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
