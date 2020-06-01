import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { Schema } from './schema';
import { offsetFromRoot, updateJsonInTree, names } from '@nrwl/workspace';
import init from '../init/init';
import { normalizeOptions, updateWorkspaceJson } from '../common-shematics';
import { AwsCdkSchematicsAdapter } from '../base-aws-cdk';
import { BaseNormalizedSchema } from '../base-normalized-schema';
import { normalize, join } from 'path';

interface NormalizedSchema extends BaseNormalizedSchema {
  id: string;
  imageId: string;
  instanceType: string;
  keyName: string;
  monitoring: boolean;
  associatePublicIpAddress: boolean;
  subnetId: string;
}
class EC2InstanceCdkSchematicsAdapter implements AwsCdkSchematicsAdapter {
  getDeployConfiguration(options: BaseNormalizedSchema) {
    return {
      builder: '@flowaccount/nx-aws-cdk:run',
      options: {
        waitUntilTargets: [options.name + ':build:production'],
        buildTarget: options.name + ':compile:production',
        skipBuild: false,
        main: 'cdk.ts',
        tsConfig: join(options.projectRoot, 'tsconfig.cdk.json'),
        outputFile: join(
          normalize('dist'),
          options.projectRoot,
          options.name,
          '.out'
        ),
        command: 'deploy',
        stackNames: ['OpenVpnStack'],
        processEnvironmentFile: 'env.json'
      }
    };
  }
  getDestroyConfiguration(options: BaseNormalizedSchema) {
    return {
      builder: '@flowaccount/nx-aws-cdk:run',
      options: {
        waitUntilTargets: [options.name + ':build:production'],
        buildTarget: options.name + ':compile:production',
        skipBuild: false,
        main: 'cdk.ts',
        tsConfig: join(options.projectRoot, 'tsconfig.cdk.json'),
        outputFile: join(
          normalize('dist'),
          options.projectRoot,
          options.name,
          '.out'
        ),
        command: 'destroy',
        stackNames: ['OpenVpnStack'],
        processEnvironmentFile: 'env.json'
      }
    };
  }
  getSynthConfiguration(options: BaseNormalizedSchema) {
    return {
      builder: '@flowaccount/nx-aws-cdk:run',
      options: {
        waitUntilTargets: [options.name + ':build:production'],
        buildTarget: options.name + ':compile:production',
        skipBuild: false,
        main: 'cdk.ts',
        tsConfig: join(options.projectRoot, 'tsconfig.cdk.json'),
        outputFile: join(
          normalize('dist'),
          options.projectRoot,
          options.name,
          '.out'
        ),
        command: 'synth',
        stackNames: [`${options.name}Stack`],
        processEnvironmentFile: 'env.json'
      }
    };
  }
  moveTemplateFiles(baseOptions: BaseNormalizedSchema): Rule {
    const options = baseOptions as NormalizedSchema;
    return mergeWith(
      apply(url('./files/app'), [
        template({
          ...options,
          ...names(options.name),
          tmpl: '',
          root: options.projectRoot,
          offset: offsetFromRoot(options.projectRoot)
        }),
        move(`${options.projectRoot}`)
      ])
    );
  }

  updateNxJson(baseOptions: BaseNormalizedSchema): Rule {
    return updateJsonInTree('/nx.json', json => {
      const options = baseOptions as NormalizedSchema;
      console.log(options.parsedTags);
      return {
        ...json,
        projects: {
          ...json.projects,
          [options.name]: { tags: options.parsedTags }
        }
      };
    });
  }
}

// Delete everything else, create a class, call the base schematics with injected class. Leave the chains here. Do this for all apps.
export default function(schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const options = normalizeOptions(schema);
    const configAdapter = new EC2InstanceCdkSchematicsAdapter();
    return chain([
      init({
        skipFormat: options.skipFormat,
        expressApp: false,
        ec2Instance: true
      }),
      configAdapter.moveTemplateFiles(options),
      updateWorkspaceJson(configAdapter, options),
      configAdapter.updateNxJson(options)
    ])(host, context);
  };
}
