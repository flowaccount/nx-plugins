import * as path from 'path';
import {
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { Schema } from './schema';
import {
  ProjectType
} from '@nrwl/workspace';
import { toFileName } from '@nrwl/workspace';
import { initGenerator } from '../init/init';
import { getBuildConfig } from '../utils';
import { join, normalize } from 'path';
import { jestProjectGenerator } from '@nrwl/jest';
import { lintProjectGenerator } from '@nrwl/linter';

interface NormalizedSchema extends Schema {
  parsedTags: string[];
  provider: string;
}

// function updateNxJson(options: NormalizedSchema) {
//   return updateJsonInTree('/nx.json', json => {
//     return {
//       ...json,
//       projects: {
//         ...json.projects,
//         [options.name]: { tags: options.parsedTags }
//       }
//     };
//   });
// }

function getServeConfig(project: any, options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:offline',
    options: {
      buildTarget: options.name + ':build',
      config: joinPathFragments(options.appProjectRoot, 'serverless.yml'),
      location: joinPathFragments(normalize('dist'), options.appProjectRoot),
      port: 7777
    },
    configurations: {
      dev: {
        buildTarget: options.name + ':build:dev'
      },
      production: {
        buildTarget: options.name + ':build:production'
      }
    }
  };
}

function getDeployConfig(project: any, options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:deploy',
    options: {
      buildTarget: options.name + ':build:production',
      config: joinPathFragments(options.appProjectRoot, 'serverless.yml'),
      location: joinPathFragments(normalize('dist'), options.appProjectRoot),
      package: joinPathFragments(normalize('dist'), options.appProjectRoot),
      stage: 'dev'
    }
  };
}

function getDestroyConfig(options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:destroy',
    options: {
      buildTarget: options.name + ':build:production',
      config: joinPathFragments(options.appProjectRoot, 'serverless.yml'),
      location: joinPathFragments(normalize('dist'), options.appProjectRoot),
      package: joinPathFragments(normalize('dist'), options.appProjectRoot)
    }
  };
}

function updateWorkspaceJson(host: Tree, options: NormalizedSchema): void {
  const project = {
    root: options.appProjectRoot,
    sourceRoot: joinPathFragments(options.appProjectRoot, 'src'),
    projectType: ProjectType.Application,
    prefix: options.name,
    schematics: {},
    targets: <any>{},
    tags: <any>{}
  };

  project.targets.build = getBuildConfig(options);
  project.targets.serve = getServeConfig(project, options);
  project.targets.deploy = getDeployConfig(project, options);
  project.targets.destroy = getDestroyConfig(options);
  // project.targets.lint = generateProjectLint(
  //   normalize(project.root),
  //   joinPathFragments(normalize(project.root), 'tsconfig.app.json'),
  //   options.linter
  // );
  project.tags = options.parsedTags
 
   addProjectConfiguration(host, options.name, project);

  // return updateWorkspaceInTree(workspaceJson => {
    // workspaceJson.projects[options.name] = project;
    // workspaceJson.defaultProject = workspaceJson.defaultProject || options.name;
    // return workspaceJson;
  // });
}

function addAppFiles(host: Tree, options: NormalizedSchema) {
    const templateOptions = {
      ...options,
      ...names(options.name), // name: options.name,
      offset: offsetFromRoot(options.appProjectRoot),
      template: '',
      root: options.appProjectRoot,
      baseWorkspaceTsConfig: options.baseWorkspaceTsConfig,
    };
    generateFiles(
      host,
      path.join(__dirname, 'files'),
      options.appProjectRoot,
      templateOptions
    );
  
  //   mergeWith(
  //   apply(url('./files/app'), [
  //     template({
  //       tmpl: '',
  //       name: options.name,
  //       root: options.appProjectRoot,
  //       baseWorkspaceTsConfig: options.baseWorkspaceTsConfig,
  //       offset: offsetFromRoot(options.appProjectRoot)
  //     }),
  //     move(options.appProjectRoot)
  //   ])
  // );
}

// function addServerlessYMLFile(host: Tree, options: NormalizedSchema) {
//   // return (host: Tree) => {
//     host.create(
//       join(options.appProjectRoot, 'serverless.yml'),
//       `service: ${options.name}
// frameworkVersion: ">=1.1.0"
// plugins:
//   - serverless-offline
// package:
//   individually: true
//   excludeDevDependencies: false
//   # path: ${join(normalize('dist'), options.appProjectRoot)}
// provider:
//   name: ${options.provider}
//   region: ${options.region}
//   endpointType: ${options.endpointType}
//   runtime: nodejs10.x
// functions:
//   hello-world:
//     handler: src/handler.helloWorld
//     events:
//       - http:
//           path: hello-world
//           method: get
//       `
//     );
//   // };
// }

// function addProxy(host: Tree, options: NormalizedSchema) {
//   // return (host: Tree, context: SchematicContext) => {
//     const projectConfig = getProjectConfig(host, options.frontendProject);
//     if (projectConfig.architect && projectConfig.architect.serve) {
//       const pathToProxyFile = `${projectConfig.root}/proxy.conf.json`;
//       const apiname = `/${options.name}-api`;
//       host.create(
//         pathToProxyFile,
//         JSON.stringify(
//           {
//             apiname: {
//               target: 'http://localhost:3333',
//               secure: false
//             }
//           },
//           null,
//           2
//         )
//       );
//       updateWorkspaceInTree(json => {
//         projectConfig.architect.serve.options.proxyConfig = pathToProxyFile;
//         json.projects[options.frontendProject] = projectConfig;
//         return json;
//       })
//       //(host, context);
//     //}
//   };
// }

function normalizeOptions(options: Schema): NormalizedSchema {
  const appDirectory = options.directory
    ? `${toFileName(options.directory)}/${toFileName(options.name)}`
    : toFileName(options.name);

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');

  const appProjectRoot = joinPathFragments(normalize('apps'), appDirectory);

  const parsedTags = options.tags
    ? options.tags.split(',').map(s => s.trim())
    : [];

  return {
    ...options,
    name: toFileName(appProjectName),
    frontendProject: options.frontendProject
      ? toFileName(options.frontendProject)
      : undefined,
    appProjectRoot,
    provider: options.provider,
    parsedTags,
    endpointType: options.endpointType ? undefined : options.endpointType
  };
}

export async function apiGenerator(host: Tree, schema: Schema) {
    const options = normalizeOptions(schema);
      initGenerator(host, {
        skipFormat: true,
        expressProxy: false,
        unitTestRunner: options.unitTestRunner
      });
      // addServerlessYMLFile(host, options);
      addAppFiles(host, options);
      updateWorkspaceJson(host, options);
      await lintProjectGenerator(host, { project: options.name, skipFormat: true });
      if (!options.unitTestRunner || options.unitTestRunner === 'jest') {
        await jestProjectGenerator(host, {
          project: options.name,
          setupFile: 'none',
          skipSerializers: true
        });
      }
      // updateNxJson(options);
      // options.unitTestRunner === 'jest'
      //   ? externalSchematic('@nrwl/jest', 'jest-project', {
      //       project: options.name,
      //       setupFile: 'none',
      //       skipSerializers: true
      //     })
      //   : noop();
      // options.frontendProject ? addProxy(host, options) : noop();
      await formatFiles(host);
}

export default apiGenerator;
export const apiSchematic = convertNxGenerator(apiGenerator);