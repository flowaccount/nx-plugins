import { BaseSchema } from '../base-schema';

export interface Schema extends BaseSchema {
  project: string;
  deploymentTarget: DeploymentTarget;
  useCdn?: boolean;
  domainName?: string;
}
