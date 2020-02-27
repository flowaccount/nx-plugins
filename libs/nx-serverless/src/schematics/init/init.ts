import { Rule, chain, noop } from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  updateJsonInTree,
  addPackageWithInit,
  updateWorkspace,
  formatFiles
} from '@nrwl/workspace';
import { Schema } from './schema';
import { nxVersion, serverlessVersion, serverlessOfflineVersion, awsTypeLambdaVersion, awsServerlessExpressVersion } from '../../utils/versions';
import { JsonObject } from '@angular-devkit/core';
function addDependencies(universal: boolean): Rule {
  const packages = {
    '@flowaccount/nx-serverless': nxVersion,
    'serverless': serverlessVersion,
    'serverless-offline': serverlessOfflineVersion,
  }
  if(universal) {
    packages['aws-serverless-express'] = awsServerlessExpressVersion;
  } else {
    packages['@types/aws-lambda'] = awsTypeLambdaVersion;
  }

  return addDepsToPackageJson(
    {},
    packages
  );
}
function moveDependency(): Rule {
  return updateJsonInTree('package.json', json => {
    json.dependencies = json.dependencies || {};
    delete json.dependencies['@flowaccount/nx-serverless'];
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
      (workspace.extensions.cli as JsonObject).defaultCollection = '@flowaccount/nx-serverless';
    }
  });
}

export default function(schema: Schema) {
    return chain([
      setDefault(),
      addPackageWithInit('@nrwl/jest'),
      addDependencies(schema.universalApp),
      moveDependency(),
      formatFiles(schema)
    ]);
}
