import { Rule, chain, noop } from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  updateJsonInTree,
  addPackageWithInit,
  updateWorkspace,
  formatFiles
} from '@nrwl/workspace';
import { Schema } from './schema';
import { nxVersion, serverlessVersion, serverlessDotEnvVersion, serverlessOfflineVersion, serverlessOptimizeVersion, serverlessTypescriptVersion, awsSdkVersion, awsTypeLambdaVersion } from '../../utils/versions';
import { JsonObject } from '@angular-devkit/core';
import { Z_NO_COMPRESSION } from 'zlib';

function addDependencies(): Rule {
  return addDepsToPackageJson(
    {},
    {
      '@nx/serverless': nxVersion,
      'serverless': serverlessVersion,
      'serverless-dotenv-plugin': serverlessDotEnvVersion,
      'serverless-offline': serverlessOfflineVersion,
      'serverless-plugin-optimize': serverlessOptimizeVersion,
      'serverless-plugin-typescript': serverlessTypescriptVersion,
      'aws-sdk': awsSdkVersion,
      '@types/aws-lambda': awsTypeLambdaVersion,
    }
  );
}
function moveDependency(): Rule {
  return updateJsonInTree('package.json', json => {
    json.dependencies = json.dependencies || {};
    delete json.dependencies['@nx/serverless'];
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
      (workspace.extensions.cli as JsonObject).defaultCollection = '@nx/serverless';
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
