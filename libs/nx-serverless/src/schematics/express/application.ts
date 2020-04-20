import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  template,
  Tree,
  url,
  externalSchematic,
  noop
} from '@angular-devkit/schematics';
import { join, normalize } from '@angular-devkit/core';
import { Schema } from './schema';
import { updateWorkspaceInTree, getProjectConfig, toFileName, addPackageWithInit } from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/workspace';
import init from '../init/init';
import { getBuildConfig } from '../utils';
import * as ts from 'typescript';
import { insertImport, insert } from '@nrwl/workspace/src/utils/ast-utils';

interface NormalizedSchema extends Schema {
  parsedTags: string[];
  provider: string;
}

function getServeConfig(options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:offline',
    options: {
      waitUntilTargets: [
        options.name + ':build'
      ],
      buildTarget: options.name + ':compile',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot)
    },
    configurations: {
      dev: {
        buildTarget: options.name + ':compile:dev'
      },
      production: {
        buildTarget: options.name + ':compile:production'
      }
    }
  };
}

function getDeployConfig(options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:deploy',
    options: {
      waitUntilTargets: [
        options.name + ':build:production'
      ],
      buildTarget: options.name + ':compile:production',
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
      buildTarget: options.name + ':compile:production',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot),
      package: join(normalize('dist'), options.appProjectRoot)
    }
  };
}

function updateWorkspaceJson(options: NormalizedSchema): Rule {
  return updateWorkspaceInTree(workspaceJson => {
    const project = workspaceJson.projects[options.name];
    const buildConfig = getBuildConfig(options);
    buildConfig.options['skipClean'] = true;
    buildConfig.options['outputPath'] = normalize('dist');
    buildConfig.options['tsConfig'] = join(
      options.appProjectRoot,
      'tsconfig.serverless.json'
    );
    buildConfig.builder = '@flowaccount/nx-serverless:compile';
    project.architect.compile = buildConfig;
    project.architect.offline = getServeConfig(options);
    project.architect.deploy = getDeployConfig(options);
    project.architect.destroy = getDestroyConfig(options);
    workspaceJson.projects[options.name] = project;
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

function updateServerTsFile(options: NormalizedSchema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const modulePath = `${options.appProjectRoot}/server.ts`;
    const content: Buffer | null = host.read(modulePath);
    let moduleSource = '';
    if (!content) {
      context.logger.error('Cannot find server.ts to replace content!');
      return host;
    }
    moduleSource = content.toString('utf-8');
    const tsSourceFile = ts.createSourceFile(
      join(options.appProjectRoot, 'server.ts'),
      moduleSource,
      ts.ScriptTarget.Latest,
      true
    );
    context.logger.info(
      'updating server.ts to support serverless-express and production mode.'
    );

    host.overwrite(
      modulePath,
      moduleSource.replace(
        `join(process.cwd(), 'dist/${options.name}/browser')`,
        `environment.production ? join(process.cwd(), './browser') : join(process.cwd(), 'dist/${options.appProjectRoot}/browser')`
      )
    );

    insert(host, modulePath, [
      insertImport(
        tsSourceFile,
        modulePath,
        'environment',
        './src/environments/environment'
      )
    ]);

    return host;
  };
}

function addServerlessYMLFile(options: NormalizedSchema): Rule {
  return (host: Tree) => {
    host.create(
      join(options.appProjectRoot, 'serverless.yml'),
      `service: ${options.name}
frameworkVersion: ">=1.1.0 <2.0.0"
plugins:
  - serverless-offline
  - serverless-apigw-binary
package:
  individually: true
  excludeDevDependencies: false
  # path: ${join(normalize('dist'), options.appProjectRoot)}
  custom:
    enable_optimize:
      local: false
provider:
  name: ${options.provider}
  region: ${options.region}
  endpointType: ${options.endpointType}
  runtime: nodejs10.x
  memorySize: 192
  timeout: 10
custom:
  apigwBinary:
    types:
      - '*/*'
functions:
  web-app:
    handler: handler.webApp
    events:
      - http: ANY {proxy+}
      - http: ANY /
      `
    );
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
        skipFormat: options.skipFormat,
        expressProxy: true
      }),
      options.initExpress ? addPackageWithInit('@nrwl/express') : noop(),
      options.initExpress ? externalSchematic('@nrwl/express', 'init', {
        name: options.name,
        skipFormat: options.skipFormat,
        skipPackageJson: options.skipPackageJson,
        directory: options.directory,
        unitTestRunner: options.unitTestRunner,
        tags: options.tags,
        linter: options.linter,
        frontendProject: options.frontendProject
      }) : noop(),
      addAppFiles(options),
      addServerlessYMLFile(options),
      updateServerTsFile(options),
      updateWorkspaceJson(options)
    ])(host, context);
  };
}
