import { Rule, chain, noop } from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  updateJsonInTree,
  addPackageWithInit,
  updateWorkspace,
  formatFiles
} from '@nrwl/workspace';
import { Schema } from './schema';
import { nxVersion, serverlessVersion, serverlessOfflineVersion, awsTypeLambdaVersion } from '../../utils/versions';
import { JsonObject } from '@angular-devkit/core';
function addDependencies(): Rule {
  return addDepsToPackageJson(
    {},
    {
      '@flowaccount/nx-serverless': nxVersion,
      'serverless': serverlessVersion,
      'serverless-offline': serverlessOfflineVersion,
      '@types/aws-lambda': awsTypeLambdaVersion,
    }
  );
}
function moveDependency(): Rule {
  return updateJsonInTree('package.json', json => {
    json.dependencies = json.dependencies || {};
    delete json.dependencies['@floaccount/nx-serverless'];
    return json;
  });
}

function setDefault(): Rule {
  return updateWorkspace( workspace => {
    workspace.extensions.cli = workspace.extensions.cli || {};
    const defaultCollection: string =
      workspace.extensions.cli &&
      ((workspace.extensions.cli as JsonObject).defaultCollection as string);
    if (!defaultCollection || defaultCollection === '@nrwl/workspace') {
      (workspace.extensions.cli as JsonObject).defaultCollection = '@floaccount/nx-serverless';
    }
  });
}

export default function(schema: Schema) {
  if(!schema.skipFormat) {
    return chain([
      setDefault(),
      addPackageWithInit('@nrwl/jest'),
      addDependencies(),
      moveDependency(),
      formatFiles(schema)
    ]);
  } else {
    return noop();
  }
}
