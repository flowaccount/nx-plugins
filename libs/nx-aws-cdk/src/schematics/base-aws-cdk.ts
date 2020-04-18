import { BaseNormalizedSchema } from './base-normalized-schema';
import { Rule } from '@angular-devkit/schematics';

export interface AwsCdkSchematicsAdapter {
  getOfflineConfiguration(options: BaseNormalizedSchema);
  getDeployConfiguration(options: BaseNormalizedSchema);
  getDestroyConfiguration(options: BaseNormalizedSchema);
  getSynthConfiguration(options: BaseNormalizedSchema);
  moveTemplateFiles(options: BaseNormalizedSchema): Rule;
}
