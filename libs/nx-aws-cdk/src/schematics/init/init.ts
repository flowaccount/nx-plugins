import {
  Rule,
  chain,
  noop,
  Tree,
  SchematicContext,
  externalSchematic
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
  awscdkVersion,
  awsTypeLambdaVersion,
  awsServerlessExpressVersion,
  serverlessApigwBinaryVersion,
  expressVersion,
  awscdkCoreVersion,
  awscdkEc2Version
} from '../../utils/versions';

function addDependencies(expressApp: boolean, ec2Instance: boolean): Rule {
  return (host: Tree, context: SchematicContext): Rule => {
    const dependencies = {};
    const devDependencies = {
      '@flowaccount/nx-aws-cdk': nxVersion,
      'aws-cdk': awscdkVersion,
      '@aws-cdk/core': awscdkCoreVersion
    };
    if (expressApp) {
      dependencies['aws-serverless-express'] = awsServerlessExpressVersion;
      dependencies['express'] = expressVersion;
      devDependencies[
        '@types/aws-serverless-express'
      ] = awsServerlessExpressVersion;
      devDependencies['serverless-apigw-binary'] = serverlessApigwBinaryVersion;
    } else if (ec2Instance) {
      devDependencies['@aws-cdk/aws-ec2'] = awscdkEc2Version;
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

function updateDependencies(): Rule {
  return updateJsonInTree('package.json', json => {
    if (json.dependencies['@flowaccount/nx-aws-cdk']) {
      json.devDependencies['@flowaccount/nx-aws-cdk'] =
        json.dependencies['@flowaccount/nx-aws-cdk'];
      delete json.dependencies['@flowaccount/nx-aws-cdk'];
    } else if (!json.devDependencies['@flowaccount/nx-aws-cdk']) {
      json.devDependencies['@flowaccount/nx-aws-cdk'] = nxVersion;
    }
    return json;
  });
}

export default function(schema: Schema) {
  return chain([
    addPackageWithInit('@nrwl/jest'),
    addDependencies(schema.expressApp, schema.ec2Instance),
    updateDependencies(),
    formatFiles(schema)
  ]);
}
