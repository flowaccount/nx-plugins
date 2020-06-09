import { BaseNormalizedSchema } from './base-normalized-schema';
import { Rule } from '@angular-devkit/schematics';

export interface AwsCdkSchematicsAdapter {
  getCdkConfiguration(options: BaseNormalizedSchema);
  getOfflineConfiguration?(options: BaseNormalizedSchema);
  getDeployConfiguration?(options: BaseNormalizedSchema);
  getDestroyConfiguration?(options: BaseNormalizedSchema);
  moveTemplateFiles(options: BaseNormalizedSchema): Rule;
}
