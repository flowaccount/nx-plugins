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
import {
  updateWorkspaceInTree,
  getProjectConfig
} from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/workspace';
import init from '../init/init';
import { getBuildConfig } from '../utils';
import * as ts from 'typescript';
import { insertImport, insert } from '@nrwl/workspace/src/utils/ast-utils';

interface NormalizedSchema extends Schema {}

function getServeConfig(options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:offline',
    options: {
      waitUntilTargets: [
        options.project + ':build',
        options.project + ':server'
      ],
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

function getDeployConfig(options: NormalizedSchema) {
  return {
    builder: '@flowaccount/nx-serverless:deploy',
    options: {
      waitUntilTargets: [
        options.project + ':build:production',
        options.project + ':server:production'
      ],
      buildTarget: options.project + ':compile:production',
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
      buildTarget: options.project + ':compile:production',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot),
      package: join(normalize('dist'), options.appProjectRoot)
    }
  };
}

function updateWorkspaceJson(options: NormalizedSchema): Rule {
  return updateWorkspaceInTree(workspaceJson => {
    const project = workspaceJson.projects[options.project];
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
    if (options.addUniversal) {
      project.architect.server.options.outputPath = join(
        normalize('dist'),
        options.appProjectRoot,
        'server'
      );
      // project.architect.server.configurations.production.fileReplacements[0].replace = join(options.appProjectRoot, 'environment.ts'),
      // project.architect.server.configurations.production.fileReplacements[0].with = join(options.appProjectRoot, 'environment.prod.ts'),
      project.architect.build.options.outputPath = join(
        normalize('dist'),
        options.appProjectRoot,
        'browser'
      );
    }
    workspaceJson.projects[options.project] = project;
    return workspaceJson;
  });
}

function addAppFiles(options: NormalizedSchema): Rule {
  return mergeWith(
    apply(url('./files/app'), [
      template({
        tmpl: '',
        name: options.project,
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
        `join(process.cwd(), 'dist/${options.project}/browser')`,
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
      `service: ${options.project}
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

function normalizeOptions(project: any, options: Schema): NormalizedSchema {
  return {
    ...options,
    appProjectRoot: project.root
  };
}

export default function(schema: Schema): Rule {
  return (host: Tree, context: SchematicContext) => {
    const project = getProjectConfig(host, schema.project);
    const options = normalizeOptions(project, schema);
    return chain([
      init({
        skipFormat: options.skipFormat,
        universalApp: true
      }),
      options.addUniversal
        ? externalSchematic('@nguniversal/express-engine', 'ng-add', {
            clientProject: options.project,
            // appId: string,
            // main: string,
            serverFileName: 'server',
            // serverPort: number,
            // tsconfigFileName?: string,
            // appDir: string,
            // rootModuleFileName: string,
            // rootModuleClassName: string,
            skipInstall: options.skipInstall
          })
        : noop(),
      addAppFiles(options),
      addServerlessYMLFile(options),
      options.addUniversal ? updateServerTsFile(options) : noop(),
      updateWorkspaceJson(options)
    ])(host, context);
  };
}
