import {
  apply,
  chain,
  externalSchematic,
  mergeWith,
  move,
  noop,
  Rule,
  SchematicContext,
  template,
  Tree,
  url
} from '@angular-devkit/schematics';
import { join, normalize, Path } from '@angular-devkit/core';
import { Schema } from './schema';
import {
  updateJsonInTree,
  updateWorkspaceInTree,
  generateProjectLint,
  addLintFiles
} from '@nrwl/workspace';
import { toFileName } from '@nrwl/workspace';
import { getProjectConfig } from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/workspace';
import init from '../init/init';
import { getBuildConfig } from '../utils';

interface NormalizedSchema extends Schema {
  parsedTags: string[];
  provider: string;
}

function updateNxJson(options: NormalizedSchema): Rule {
  return updateJsonInTree('/nx.json', json => {
    return {
      ...json,
      projects: {
        ...json.projects,
        [options.name]: { tags: options.parsedTags }
      }
    };
  });
}

function getServeConfig(project: any, options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:offline',
    options: {
      buildTarget: options.name + ':build',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot)
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
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot),
      package: join(normalize('dist'), options.appProjectRoot)
    }
  };
}

function getDestroyConfig(options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:destroy',
    options: {
      buildTarget: options.name + ':build:production',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot),
      package: join(normalize('dist'), options.appProjectRoot)
    }
  };
}

function updateWorkspaceJson(options: NormalizedSchema): Rule {
  return updateWorkspaceInTree(workspaceJson => {
    const project = {
      root: options.appProjectRoot,
      sourceRoot: join(options.appProjectRoot, 'src'),
      projectType: 'application',
      prefix: options.name,
      schematics: {},
      architect: <any>{}
    };

    project.architect.build = getBuildConfig(options);
    project.architect.serve = getServeConfig(project, options);
    project.architect.deploy = getDeployConfig(project, options);
    project.architect.destroy = getDestroyConfig(options);
    project.architect.lint = generateProjectLint(
      normalize(project.root),
      join(normalize(project.root), 'tsconfig.app.json'),
      options.linter
    );
    workspaceJson.projects[options.name] = project;
    workspaceJson.defaultProject = workspaceJson.defaultProject || options.name;
    return workspaceJson;
  });
}

function addAppFiles(options: NormalizedSchema): Rule {
  return mergeWith(
    apply(url('./files/app'), [
      template({
        tmpl: '',
        name: options.name,
        root: options.appProjectRoot,
        offset: offsetFromRoot(options.appProjectRoot)
      }),
      move(options.appProjectRoot)
    ])
  );
}

function addServerlessYMLFile(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    host.create(
      join(options.appProjectRoot, 'serverless.yml'),
      `service: ${options.name}
frameworkVersion: ">=1.1.0 <2.0.0"
plugins:
  - serverless-offline
package:
  individually: true
  excludeDevDependencies: false
  # path: ${join(normalize('dist'), options.appProjectRoot)}
  custom:
    enable_optimize:
      local: false
provider:
  name: ${options.provider}
  runtime: nodejs10.x
functions:
  hello-world:
    handler: src/handler.helloWorld
    events:
      - http:
          path: hello-world
          method: get
      `
    );
  };
}

function addProxy(options: NormalizedSchema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const projectConfig = getProjectConfig(host, options.frontendProject);
    if (projectConfig.architect && projectConfig.architect.serve) {
      const pathToProxyFile = `${projectConfig.root}/proxy.conf.json`;
      const apiname = `/${options.name}-api`;
      host.create(
        pathToProxyFile,
        JSON.stringify(
          {
            apiname: {
              target: 'http://localhost:3333',
              secure: false
            }
          },
          null,
          2
        )
      );
      updateWorkspaceInTree(json => {
        projectConfig.architect.serve.options.proxyConfig = pathToProxyFile;
        json.projects[options.frontendProject] = projectConfig;
        return json;
      })(host, context);
    }
  };
}

function normalizeOptions(options: Schema): NormalizedSchema {
  const appDirectory = options.directory
    ? `${toFileName(options.directory)}/${toFileName(options.name)}`
    : toFileName(options.name);

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');

  const appProjectRoot = join(normalize('apps'), appDirectory);

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
    parsedTags
  };
}

export default function(schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const options = normalizeOptions(schema);
    return chain([
      init({
        skipFormat: false,
        universalApp: false
      }),
      addLintFiles(options.appProjectRoot, options.linter),
      addAppFiles(options),
      addServerlessYMLFile(options),
      updateWorkspaceJson(options),
      updateNxJson(options),
      options.unitTestRunner === 'jest'
        ? externalSchematic('@nrwl/jest', 'jest-project', {
            project: options.name,
            setupFile: 'none',
            skipSerializers: true
          })
        : noop(),
      options.frontendProject ? addProxy(options) : noop()
    ])(host, context);
  };
}
