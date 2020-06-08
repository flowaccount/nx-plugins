import { BaseSchema } from '../base-schema';

export interface Schema extends BaseSchema {
  id: string;
  imageId: string;
  instanceType: string;
  keyName: string;
  monitoring: boolean;
  associatePublicIpAddress: boolean;
  subnetId: string;
  skipFormat: boolean;
}
