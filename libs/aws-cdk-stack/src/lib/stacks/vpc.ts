import { IVpc, Subnet, SubnetSelection, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStackProperties } from '../types';
import { logger } from '@nx/devkit';

export class VpcStack extends Stack {
  public readonly vpc: IVpc;
  public readonly subnetSelection: SubnetSelection;

  constructor(scope: Construct, id: string, _props: VpcStackProperties) {
    super(scope, id, _props);
    logger.info('fetching vpc by its attributes');
    this.vpc = Vpc.fromVpcAttributes(
      this,
      `${id}-${_props.vpcAttributes.vpcId}`,
      _props.vpcAttributes
    );

    this.subnetSelection = {
      subnets: _props.subnets.map((attr, index) =>
        Subnet.fromSubnetAttributes(this, `subnet${index}`, attr)
      ),
    };
  }
}
