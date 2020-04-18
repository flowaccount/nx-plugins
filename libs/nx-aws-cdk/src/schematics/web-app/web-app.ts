import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  applyTemplates,
  Tree,
  url
} from '@angular-devkit/schematics';
import { Schema } from './schema';
import { offsetFromRoot } from '@nrwl/workspace';
import init from '../init/init';
import { normalizeOptions, updateWorkspaceJson } from '../common-shematics';
import { AwsCdkSchematicsAdapter } from '../base-aws-cdk';
import { BaseNormalizedSchema } from '../base-normalized-schema';

class WebAppAwsCdkSchematicsAdapter implements AwsCdkSchematicsAdapter {
  getOfflineConfiguration(options: BaseNormalizedSchema) {
    return;
  }
  getDeployConfiguration(options: BaseNormalizedSchema) {
    return;
  }
  getDestroyConfiguration(options: BaseNormalizedSchema) {
    return;
  }
  getSynthConfiguration(options: BaseNormalizedSchema) {
    return;
  }
  moveTemplateFiles(options: BaseNormalizedSchema): Rule {
    return mergeWith(
      apply(url('./files/app'), [
        applyTemplates({
          tmpl: '',
          name: options.projectName,
          root: options.projectRoot,
          offset: offsetFromRoot(options.projectRoot)
        }),
        move(options.projectRoot)
      ])
    );
  }
}

// Delete everything else, create a class, call the base schematics with injected class. Leave the chains here. Do this for all apps.
export default function(schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const options = normalizeOptions(schema);
    const configAdapter = new WebAppAwsCdkSchematicsAdapter();
    return chain([
      init({
        skipFormat: options.skipFormat,
        expressApp: true
      }),
      updateWorkspaceJson(configAdapter, options),
      configAdapter.moveTemplateFiles(options)
    ])(host, context);
  };
}
