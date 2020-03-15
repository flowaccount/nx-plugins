import {
  Rule,
  chain,
  noop,
  Tree,
  SchematicContext
} from '@angular-devkit/schematics';
import {
  addDepsToPackageJson,
  updateJsonInTree,
  addPackageWithInit,
  formatFiles,
  readJsonInTree
} from '@nrwl/workspace';
import { Schema } from './schema';
import {
  nxVersion,
  serverlessVersion,
  serverlessOfflineVersion,
  awsTypeLambdaVersion,
  awsServerlessExpressVersion,
  serverlessApigwBinaryVersion,
  expressVersion
} from '../../utils/versions';

function addDependencies(universal: boolean): Rule {
  return (host: Tree, context: SchematicContext): Rule => {
    const dependencies = {};
    const devDependencies = {
      '@flowaccount/nx-serverless': nxVersion,
      serverless: serverlessVersion,
      'serverless-offline': serverlessOfflineVersion
    };
    if (universal) {
      dependencies['aws-serverless-express'] = awsServerlessExpressVersion;
      dependencies['express'] = expressVersion;
      devDependencies[
        '@types/aws-serverless-express'
      ] = awsServerlessExpressVersion;
      devDependencies['serverless-apigw-binary'] = serverlessApigwBinaryVersion;
    } else {
      devDependencies['@types/aws-lambda'] = awsTypeLambdaVersion;
    }

    const packageJson = readJsonInTree(host, 'package.json');
    Object.keys(dependencies).forEach(key => {
      if (packageJson.dependencies[key]) {
        delete dependencies[key];
      }
    });

    Object.keys(devDependencies).forEach(key => {
      if (packageJson.devDependencies[key]) {
        delete devDependencies[key];
      }
    });

    if (
      !Object.keys(dependencies).length &&
      !Object.keys(devDependencies).length
    ) {
      context.logger.info('Skipping update package.json');
      return noop();
    }
    return addDepsToPackageJson(dependencies, devDependencies);
  };
}

function moveDependency(): Rule {
  return updateJsonInTree('package.json', json => {
    json.dependencies = json.dependencies || {};
    delete json.dependencies['@flowaccount/nx-serverless'];
    return json;
  });
}

export default function(schema: Schema) {
  return chain([
    addPackageWithInit('@nrwl/jest'),
    addDependencies(schema.universalApp),
    moveDependency(),
    formatFiles(schema)
  ]);
}
