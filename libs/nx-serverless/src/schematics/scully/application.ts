import { Schema } from './schema';
import { updateWorkspaceInTree, getProjectConfig } from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/workspace';
import { initGenerator } from '../init/init';
import { getBuildConfig } from '../utils';
import { join, normalize } from 'path';
import { generateFiles, names, ProjectConfiguration, readProjectConfiguration, Tree, updateProjectConfiguration } from '@nrwl/devkit';

interface NormalizedSchema extends Schema {}

function getServeConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:offline',
    options: {
      waitUntilTargets: [options.project + ':scully'],
      buildTarget: options.project + ':compile',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot)
    },
    configurations: {
      dev: {
        buildTarget: options.project + ':compile:dev'
      },
      production: {
        buildTarget: options.project + ':compile:production'
      }
    }
  };
}

function getScullyBuilderConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:scully',
    options: {
      buildTarget: options.project + ':build:production',
      configFiles: [join(options.appProjectRoot, 'scully.config.js')],
      scanRoutes: true,
      removeStaticDist: true,
      skipBuild: false
    }
  };
}

function getDeployConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:deploy',
    options: {
      waitUntilTargets: [options.project + ':scully'],
      buildTarget: options.project + ':compile:production',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot),
      package: join(normalize('dist'), options.appProjectRoot)
    }
  };
}

function getDestroyConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:destroy',
    options: {
      buildTarget: options.project + ':compile:production',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot),
      package: join(normalize('dist'), options.appProjectRoot)
    }
  };
}

function updateWorkspaceJson(host: Tree, options: NormalizedSchema, project: ProjectConfiguration) {

    const buildConfig = getBuildConfig(options);
    buildConfig.options['skipClean'] = true;
    buildConfig.options['outputPath'] = normalize('dist');
    buildConfig.options['tsConfig'] = join(
      options.appProjectRoot,
      'tsconfig.serverless.json'
    );
    buildConfig.executor = '@flowaccount/nx-serverless:compile';
    project.targets.compile = buildConfig;
    project.targets.scully = getScullyBuilderConfig(options);
    project.targets.offline = getServeConfig(options);
    project.targets.deploy = getDeployConfig(options);
    project.targets.destroy = getDestroyConfig(options);

    updateProjectConfiguration(host, options.project, project) 
}

function addAppFiles(host:Tree ,options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.project), // name: options.name,
    offsetFromRoot: offsetFromRoot(options.appProjectRoot),
    template: '',
    root: options.appProjectRoot
  };
  generateFiles(
    host,
    join(__dirname, 'files'),
    options.appProjectRoot,
    templateOptions
  );
  // return mergeWith(
  //   apply(url('./files/app'), [
  //     template({
  //       tmpl: '',
  //       name: options.project,
  //       root: options.appProjectRoot,
  //       offset: offsetFromRoot(options.appProjectRoot)
  //     }),
  //     move(options.appProjectRoot)
  //   ])
  // );
}

// function addServerlessYMLFile(options: NormalizedSchema): Rule {
//   return (host: Tree) => {
//     host.create(
//       join(options.appProjectRoot, 'serverless.yml'),
//       `service: ${options.project}
// frameworkVersion: ">=1.1.0"
// plugins:
//   - serverless-offline
//   - serverless-apigw-binary
// package:
//   individually: true
//   excludeDevDependencies: false
//   # path: ${join(normalize('dist'), options.appProjectRoot)}
//   custom:
//     enable_optimize:
//       local: false
// provider:
//   name: ${options.provider}
//   region: ${options.region}
//   endpointType: ${options.endpointType}
//   runtime: nodejs10.x
//   memorySize: 192
//   timeout: 10
// custom:
//   apigwBinary:
//     types:
//       - '*/*'
// functions:
//   web-app:
//     handler: handler.webApp
//     events:
//       - http: ANY {proxy+}
//       - http: ANY /
//       `
//     );
//   };
// }

function normalizeOptions(project: any, options: Schema): NormalizedSchema {
  return {
    ...options,
    appProjectRoot: project.root
  };
}

export default function(host: Tree, schema: Schema) {
  
    const project = readProjectConfiguration(host, schema.project);
    const options = normalizeOptions(project, schema);
    initGenerator(host, {
      skipFormat: options.skipFormat,
      expressProxy: true
    });
   
      // options.addScully
      //   ? externalSchematic('@scullyio/scully', 'run', {

      //     })
      //   : noop(),
      addAppFiles(host, options),
      // addServerlessYMLFile(options),
      updateWorkspaceJson(host, options, project)
    
}
