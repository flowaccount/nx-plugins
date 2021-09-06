import { VpcAttributes } from '@aws-cdk/aws-ec2';
import { VpcProps } from '@aws-cdk/aws-ec2';

export class VPCModel {
  name: string;
  vpcProps: VpcProps;
}
export class VpcReference {
  vpcAttributes: VpcAttributes;
}
