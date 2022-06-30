import {
  Tree,
  updateJson,
  addDependenciesToPackageJson,
  GeneratorCallback,
  readJson,
  formatFiles,
  convertNxGenerator,
  logger,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
// import { cdkVersion, awsTypeLambdaVersion } from '../../versions';
// import { cdkSchematicFlags } from '../schema';
// import { addJestPlugin } from './lib/add-jest-plugin';
// import { addLinterPlugin } from './lib/add-linter-plugin';

function addDependencies(host: Tree): GeneratorCallback[] {
  const dependencies = {};
  const tasks: GeneratorCallback[] = [];
  // const devDependencies = {
  //   'aws-cdk': cdkVersion,
  // };

  // devDependencies['@types/aws-lambda'] = awsTypeLambdaVersion;

  const packageJson = readJson(host, 'package.json');
  Object.keys(dependencies).forEach((key) => {
    if (packageJson.dependencies[key]) {
      delete dependencies[key];
    }
  });

  // Object.keys(devDependencies).forEach((key) => {
  //   if (packageJson.devDependencies[key]) {
  //     delete devDependencies[key];
  //   }
  // });

  // if (
  //   !Object.keys(dependencies).length &&
  //   !Object.keys(devDependencies).length
  // ) {
  //   logger.info('Skipping update package.json');
  //   return tasks;
  // }
  // tasks.push(addDependenciesToPackageJson(host, dependencies, devDependencies));
  return tasks;
}

function updateDependencies(tree: Tree) {
  updateJson(tree, '/package.json', (json) => {
    if (json.dependencies['@flowaccount/nx-awscdk']) {
      json.devDependencies['@flowaccount/nx-awscdk'] =
        json.dependencies['@flowaccount/nx-awscdk'];
      delete json.dependencies['@flowaccount/nx-awscdk'];
    } else if (!json.devDependencies['@flowaccount/nx-awscdk']) {
      // json.devDependencies['@flowaccount/nx-awscdk'] = cdkVersion;
    }
    return json;
  });
}

// export async function initGenerator<T extends cdkSchematicFlags>(
//   tree: Tree,
//   options: T
// ) {
//   const tasks: GeneratorCallback[] = [];

//   // if (!options.unitTestRunner || options.unitTestRunner === 'jest') {
//   //   const jestTask = addJestPlugin(tree);
//   //   tasks.push(jestTask);
//   // }
//   // const linterTask = addLinterPlugin(tree);
//   // tasks.push(linterTask);

//   updateDependencies(tree);
//   tasks.push(...addDependencies(tree));
//   // if (!options.skipFormat) {
//   //   await formatFiles(tree);
//   // }
//   return runTasksInSerial(...tasks);
// }

// export const initSchematic = convertNxGenerator(initGenerator);
