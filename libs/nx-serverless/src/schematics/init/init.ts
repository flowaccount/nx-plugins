import {
  Tree,
  updateJson,
  addDependenciesToPackageJson,
  GeneratorCallback,
  readJson,
  formatFiles,
  convertNxGenerator,
  logger,
} from '@nx/devkit';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';
import { jestInitGenerator } from '@nx/jest';
import { Schema } from './schema';
import {
  nxVersion,
  serverlessVersion,
  serverlessOfflineVersion,
  awsTypeLambdaVersion,
  awsServerlessExpressVersion,
  serverlessApigwBinaryVersion,
  expressVersion,
} from '../../utils/versions';
import { addJestPlugin } from './lib/add-jest-plugin';
import { addLinterPlugin } from './lib/add-linter-plugin';

function addDependencies(
  host: Tree,
  expressProxy: boolean
): GeneratorCallback[] {
  const dependencies = {};
  const tasks: GeneratorCallback[] = [];
  const devDependencies = {
    '@flowaccount/nx-serverless': nxVersion,
    serverless: serverlessVersion,
    'serverless-offline': serverlessOfflineVersion,
  };
  if (expressProxy) {
    dependencies['aws-serverless-express'] = awsServerlessExpressVersion;
    dependencies['express'] = expressVersion;
    devDependencies['@types/aws-serverless-express'] =
      awsServerlessExpressVersion;
    devDependencies['serverless-apigw-binary'] = serverlessApigwBinaryVersion;
  } else {
    devDependencies['@types/aws-lambda'] = awsTypeLambdaVersion;
  }
  const packageJson = readJson(host, 'package.json');
  Object.keys(dependencies).forEach((key) => {
    if (packageJson.dependencies[key]) {
      delete dependencies[key];
    }
  });

  Object.keys(devDependencies).forEach((key) => {
    if (packageJson.devDependencies[key]) {
      delete devDependencies[key];
    }
  });

  if (
    !Object.keys(dependencies).length &&
    !Object.keys(devDependencies).length
  ) {
    logger.info('Skipping update package.json');
    return tasks;
  }
  tasks.push(addDependenciesToPackageJson(host, dependencies, devDependencies));
  return tasks;
}

function updateDependencies(tree: Tree) {
  updateJson(tree, '/package.json', (json) => {
    if (json.dependencies['@flowaccount/nx-serverless']) {
      json.devDependencies['@flowaccount/nx-serverless'] =
        json.dependencies['@flowaccount/nx-serverless'];
      delete json.dependencies['@flowaccount/nx-serverless'];
    } else if (!json.devDependencies['@flowaccount/nx-serverless']) {
      json.devDependencies['@flowaccount/nx-serverless'] = nxVersion;
    }
    return json;
  });
}

export async function initGenerator<T extends Schema>(tree: Tree, options: T) {
  const tasks: GeneratorCallback[] = [];

  if (!options.unitTestRunner || options.unitTestRunner === 'jest') {
    const jestTask = addJestPlugin(tree);
    tasks.push(jestTask);
  }
  const linterTask = addLinterPlugin(tree);
  tasks.push(linterTask);

  updateDependencies(tree);
  tasks.push(...addDependencies(tree, options.expressProxy));
  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return runTasksInSerial(...tasks);
}

export const initSchematic = convertNxGenerator(initGenerator);
