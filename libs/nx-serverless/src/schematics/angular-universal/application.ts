import { Schema } from './schema';
import { updateWorkspaceInTree, getProjectConfig } from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/workspace';
import { initGenerator } from '../init/init';
import { getBuildConfig } from '../utils';
import * as ts from 'typescript';
import { insertImport, insert } from '@nrwl/workspace/src/utils/ast-utils';
import { join, normalize } from 'path';
import { names, ProjectConfiguration, Tree, updateProjectConfiguration, generateFiles, readProjectConfiguration } from '@nrwl/devkit';

interface NormalizedSchema extends Schema {}

function getServeConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:offline',
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
    executor: '@flowaccount/nx-serverless:deploy',
    options: {
      waitUntilTargets: [
        options.project + ':build:production',
        options.project + ':server:production'
      ],
      buildTarget: options.project + ':compile:production',
      config: join(options.appProjectRoot, 'serverless.yml'),
      location: join(normalize('dist'), options.appProjectRoot),
      package: join(normalize('dist'), options.appProjectRoot),
      stage: 'dev'
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
    project.targets.offline = getServeConfig(options);
    project.targets.deploy = getDeployConfig(options);
    project.targets.destroy = getDestroyConfig(options);
    if (options.addUniversal) {
      project.targets.server.options.outputPath = join(
        normalize('dist'),
        options.appProjectRoot,
        'server'
      );
      // project.targets.server.configurations.production.fileReplacements[0].replace = join(options.appProjectRoot, 'environment.ts'),
      // project.targets.server.configurations.production.fileReplacements[0].with = join(options.appProjectRoot, 'environment.prod.ts'),
      project.targets.build.options.outputPath = join(
        normalize('dist'),
        options.appProjectRoot,
        'browser'
      );
    }
    updateProjectConfiguration(host, options.project, project) 
}

function addAppFiles(host: Tree, options: NormalizedSchema) {
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

// function updateServerTsFile(options: NormalizedSchema): Rule {
//   return (host: Tree, context: SchematicContext) => {
//     const modulePath = `${options.appProjectRoot}/server.ts`;
//     const content: Buffer | null = host.read(modulePath);
//     let moduleSource = '';
//     if (!content) {
//       context.logger.error('Cannot find server.ts to replace content!');
//       return host;
//     }
//     moduleSource = content.toString('utf-8');
//     const tsSourceFile = ts.createSourceFile(
//       join(options.appProjectRoot, 'server.ts'),
//       moduleSource,
//       ts.ScriptTarget.Latest,
//       true
//     );
//     context.logger.info(
//       'updating server.ts to support serverless-express and production mode.'
//     );

//     host.overwrite(
//       modulePath,
//       moduleSource.replace(
//         `join(process.cwd(), 'dist/${options.project}/browser')`,
//         `environment.production ? join(process.cwd(), './browser') : join(process.cwd(), 'dist/${options.appProjectRoot}/browser')`
//       )
//     );

//     insert(host, modulePath, [
//       insertImport(
//         tsSourceFile,
//         modulePath,
//         'environment',
//         './src/environments/environment'
//       )
//     ]);

//     return host;
//   };
// }

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
      // options.addUniversal
      //   ? externalSchematic('@nguniversal/express-engine', 'ng-add', {
      //       clientProject: options.project,
      //       // appId: string,
      //       // main: string,
      //       serverFileName: 'server',
      //       // serverPort: number,
      //       // tsconfigFileName?: string,
      //       // appDir: string,
      //       // rootModuleFileName: string,
      //       // rootModuleClassName: string,
      //       skipInstall: options.skipInstall
      //     })
      //   : noop(),
      addAppFiles(host, options),
      // addServerlessYMLFile(options),
      // options.addUniversal ? updateServerTsFile(options) : noop(),
      updateWorkspaceJson(host, options, project)
}
