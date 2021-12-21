import { Schema } from './schema';
import {
  updateWorkspaceInTree,
  toFileName,
  addPackageWithInit,
} from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/workspace';
import { initGenerator } from '../init/init';
import { getBuildConfig } from '../utils';
import { join, normalize } from 'path';
import {
  names,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
  generateFiles,
  convertNxGenerator,
  joinPathFragments,
} from '@nrwl/devkit';
import { applicationGenerator } from '@nrwl/express';
import { initGenerator as initGeneratorExpress } from '@nrwl/express/src/generators/init/init';
interface NormalizedSchema extends Schema {
  parsedTags: string[];
  provider: string;
}

function getServeConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:offline',
    options: {
      waitUntilTargets: [options.name + ':build'],
      buildTarget: options.name + ':compile',
      config: joinPathFragments(options.appProjectRoot, 'serverless.ts'),
      location: joinPathFragments(normalize('dist'), options.appProjectRoot),
    },
    configurations: {
      dev: {
        buildTarget: options.name + ':compile:dev',
      },
      production: {
        buildTarget: options.name + ':compile:production',
      },
    },
  };
}

function getDeployConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:deploy',
    options: {
      waitUntilTargets: [options.name + ':build:production'],
      buildTarget: options.name + ':compile:production',
      config: joinPathFragments(options.appProjectRoot, 'serverless.ts'),
      location: joinPathFragments(normalize('dist'), options.appProjectRoot),
      package: joinPathFragments(normalize('dist'), options.appProjectRoot),
      stage: 'dev',
    },
  };
}

function getDestroyConfig(options: NormalizedSchema) {
  return {
    executor: '@flowaccount/nx-serverless:destroy',
    options: {
      buildTarget: options.name + ':compile:production',
      config: joinPathFragments(options.appProjectRoot, 'serverless.ts'),
      location: joinPathFragments(normalize('dist'), options.appProjectRoot),
      package: joinPathFragments(normalize('dist'), options.appProjectRoot),
    },
  };
}

function updateWorkspaceJson(
  host: Tree,
  options: NormalizedSchema,
  project: ProjectConfiguration
) {
  const buildConfig = getBuildConfig(options);
  buildConfig.options['skipClean'] = true;
  buildConfig.options['outputPath'] = normalize('dist');
  buildConfig.options['tsConfig'] = joinPathFragments(
    options.appProjectRoot,
    'tsconfig.serverless.json'
  );
  buildConfig.executor = '@flowaccount/nx-serverless:compile';
  project.targets.compile = buildConfig;
  project.targets.offline = getServeConfig(options);
  project.targets.deploy = getDeployConfig(options);
  project.targets.destroy = getDestroyConfig(options);
  updateProjectConfiguration(host, options.name, project);
}

function addAppFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name), // name: options.name,
    offset: offsetFromRoot(options.appProjectRoot),
    template: '',
    root: options.appProjectRoot,
  };
  generateFiles(
    host,
    join(__dirname, 'files'),
    options.appProjectRoot,
    templateOptions
  );
  // return (tree: Tree, _context: SchematicContext) => {
  //   const rule = mergeWith(
  //     apply(url('./files/app'), [
  //       template({
  //         tmpl: '',
  //         name: options.name,
  //         root: options.appProjectRoot,
  //         offset: offsetFromRoot(options.appProjectRoot)
  //       }),
  //       move(options.appProjectRoot),
  //       forEach((fileEntry: FileEntry) => {
  //         // Just by adding this is allows the file to be overwritten if it already exists
  //         if (tree.exists(fileEntry.path)) return null;
  //         return fileEntry;
  //       })
  //     ])
  //   );
  //   return rule(tree, _context);
  // };
}

// function updateServerTsFile(host:Tree, options: NormalizedSchema) {

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
//         `join(process.cwd(), 'dist/${options.name}/browser')`,
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
// }

// function addServerlessYMLFile(options: NormalizedSchema): Rule {
//   return (host: Tree) => {
//     host.create(
//       join(options.appProjectRoot, 'serverless.ts'),
//       `service: ${options.name}
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

function normalizeOptions(options: Schema): NormalizedSchema {
  const appDirectory = options.directory
    ? `${toFileName(options.directory)}/${toFileName(options.name)}`
    : toFileName(options.name);

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');

  const appProjectRoot = joinPathFragments(normalize('apps'), appDirectory);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
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
    endpointType: options.endpointType ? undefined : options.endpointType,
  };
}

export async function expressApiGenerator(host: Tree, schema: Schema) {
  const options = normalizeOptions(schema);
  initGenerator(host, {
    skipFormat: options.skipFormat,
    expressProxy: true,
    unitTestRunner: options.unitTestRunner,
  });

  if (options.initExpress) {
    await initGeneratorExpress(host, {
      unitTestRunner: options.unitTestRunner,
    });
    await applicationGenerator(host, {
      name: schema.name,
      skipFormat: schema.skipFormat,
      skipPackageJson: schema.skipPackageJson,
      directory: schema.directory,
      unitTestRunner: schema.unitTestRunner,
      tags: schema.tags,
      linter: schema.linter,
      frontendProject: schema.frontendProject,
      js: false,
      pascalCaseFiles: false,
    });
  }
  addAppFiles(host, options);
  // addServerlessYMLFile(options),
  // updateServerTsFile(options),
  const project = readProjectConfiguration(host, options.name);
  updateWorkspaceJson(host, options, project);
}

export default expressApiGenerator;
export const expressApiSchematic = convertNxGenerator(expressApiGenerator);
