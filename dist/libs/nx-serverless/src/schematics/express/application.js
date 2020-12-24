"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const workspace_1 = require("@nrwl/workspace");
const workspace_2 = require("@nrwl/workspace");
const init_1 = require("../init/init");
const utils_1 = require("../utils");
function getServeConfig(options) {
    return {
        builder: '@flowaccount/nx-serverless:offline',
        options: {
            waitUntilTargets: [options.name + ':build'],
            buildTarget: options.name + ':compile',
            config: core_1.join(options.appProjectRoot, 'serverless.yml'),
            location: core_1.join(core_1.normalize('dist'), options.appProjectRoot)
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
function getDeployConfig(options) {
    return {
        builder: '@flowaccount/nx-serverless:deploy',
        options: {
            waitUntilTargets: [options.name + ':build:production'],
            buildTarget: options.name + ':compile:production',
            config: core_1.join(options.appProjectRoot, 'serverless.yml'),
            location: core_1.join(core_1.normalize('dist'), options.appProjectRoot),
            package: core_1.join(core_1.normalize('dist'), options.appProjectRoot)
        }
    };
}
function getDestroyConfig(options) {
    return {
        builder: '@flowaccount/nx-serverless:destroy',
        options: {
            buildTarget: options.name + ':compile:production',
            config: core_1.join(options.appProjectRoot, 'serverless.yml'),
            location: core_1.join(core_1.normalize('dist'), options.appProjectRoot),
            package: core_1.join(core_1.normalize('dist'), options.appProjectRoot)
        }
    };
}
function updateWorkspaceJson(options) {
    return workspace_1.updateWorkspaceInTree(workspaceJson => {
        const project = workspaceJson.projects[options.name];
        const buildConfig = utils_1.getBuildConfig(options);
        buildConfig.options['skipClean'] = true;
        buildConfig.options['outputPath'] = core_1.normalize('dist');
        buildConfig.options['tsConfig'] = core_1.join(options.appProjectRoot, 'tsconfig.serverless.json');
        buildConfig.builder = '@flowaccount/nx-serverless:compile';
        project.architect.compile = buildConfig;
        project.architect.offline = getServeConfig(options);
        project.architect.deploy = getDeployConfig(options);
        project.architect.destroy = getDestroyConfig(options);
        workspaceJson.projects[options.name] = project;
        return workspaceJson;
    });
}
function addAppFiles(options) {
    return (tree, _context) => {
        const rule = schematics_1.mergeWith(schematics_1.apply(schematics_1.url('./files/app'), [
            schematics_1.template({
                tmpl: '',
                name: options.name,
                root: options.appProjectRoot,
                offset: workspace_2.offsetFromRoot(options.appProjectRoot)
            }),
            schematics_1.move(options.appProjectRoot),
            schematics_1.forEach((fileEntry) => {
                // Just by adding this is allows the file to be overwritten if it already exists
                if (tree.exists(fileEntry.path))
                    return null;
                return fileEntry;
            })
        ]));
        return rule(tree, _context);
    };
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
//     return host;
//   };
// }
function addServerlessYMLFile(options) {
    return (host) => {
        host.create(core_1.join(options.appProjectRoot, 'serverless.yml'), `service: ${options.name}
frameworkVersion: ">=1.1.0 <2.0.0"
plugins:
  - serverless-offline
  - serverless-apigw-binary
package:
  individually: true
  excludeDevDependencies: false
  # path: ${core_1.join(core_1.normalize('dist'), options.appProjectRoot)}
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
      `);
    };
}
function normalizeOptions(options) {
    const appDirectory = options.directory
        ? `${workspace_1.toFileName(options.directory)}/${workspace_1.toFileName(options.name)}`
        : workspace_1.toFileName(options.name);
    const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
    const appProjectRoot = core_1.join(core_1.normalize('apps'), appDirectory);
    const parsedTags = options.tags
        ? options.tags.split(',').map(s => s.trim())
        : [];
    return Object.assign(Object.assign({}, options), { name: workspace_1.toFileName(appProjectName), frontendProject: options.frontendProject
            ? workspace_1.toFileName(options.frontendProject)
            : undefined, appProjectRoot, provider: options.provider, parsedTags });
}
function default_1(schema) {
    return (host, context) => {
        const options = normalizeOptions(schema);
        return schematics_1.chain([
            init_1.default({
                skipFormat: options.skipFormat,
                expressProxy: true
            }),
            options.initExpress
                ? workspace_1.addPackageWithInit('@nrwl/express', {
                    unitTestRunner: options.unitTestRunner
                })
                : schematics_1.noop(),
            options.initExpress
                ? schematics_1.externalSchematic('@nrwl/express', 'app', {
                    name: schema.name,
                    skipFormat: schema.skipFormat,
                    skipPackageJson: schema.skipPackageJson,
                    directory: schema.directory,
                    unitTestRunner: schema.unitTestRunner,
                    tags: schema.tags,
                    linter: schema.linter,
                    frontendProject: schema.frontendProject
                })
                : schematics_1.noop(),
            addAppFiles(options),
            addServerlessYMLFile(options),
            // updateServerTsFile(options),
            updateWorkspaceJson(options)
        ])(host, context);
    };
}
exports.default = default_1;
//# sourceMappingURL=application.js.map