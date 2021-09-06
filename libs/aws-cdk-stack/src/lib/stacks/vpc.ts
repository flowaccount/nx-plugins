import { IVpc, Vpc, VpcAttributes } from '@aws-cdk/aws-ec2';
import { Stack, Construct } from '@aws-cdk/core';
import { logger } from '@nrwl/devkit';

export class AwsVpcReference extends Stack {
  readonly vpc: IVpc;

  constructor(scope: Construct, id: string, vpcAttributes: VpcAttributes) {
    super(scope, id);
    logger.info('fetching vpn by its attributes');
    this.vpc = Vpc.fromVpcAttributes(this, id, vpcAttributes);
  }
}
