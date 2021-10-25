
import { Rule } from '@angular-devkit/schematics';
import { NormalizedSchema } from './normalized-schema';

export interface AwsCdkSchematicsAdapter {
  getCdkConfiguration(options: NormalizedSchema);
  getOfflineConfiguration?(options: NormalizedSchema);
  getDeployConfiguration?(options: NormalizedSchema);
  getDestroyConfiguration?(options: NormalizedSchema);
  moveTemplateFiles(options: NormalizedSchema): Rule;
}
