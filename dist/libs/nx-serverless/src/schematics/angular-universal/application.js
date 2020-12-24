"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const workspace_1 = require("@nrwl/workspace");
const workspace_2 = require("@nrwl/workspace");
const init_1 = require("../init/init");
const utils_1 = require("../utils");
const ts = require("typescript");
const ast_utils_1 = require("@nrwl/workspace/src/utils/ast-utils");
function getServeConfig(options) {
    return {
        builder: '@flowaccount/nx-serverless:offline',
        options: {
            waitUntilTargets: [
                options.project + ':build',
                options.project + ':server'
            ],
            buildTarget: options.project + ':compile',
            config: core_1.join(options.appProjectRoot, 'serverless.yml'),
            location: core_1.join(core_1.normalize('dist'), options.appProjectRoot)
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
function getDeployConfig(options) {
    return {
        builder: '@flowaccount/nx-serverless:deploy',
        options: {
            waitUntilTargets: [
                options.project + ':build:production',
                options.project + ':server:production'
            ],
            buildTarget: options.project + ':compile:production',
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
            buildTarget: options.project + ':compile:production',
            config: core_1.join(options.appProjectRoot, 'serverless.yml'),
            location: core_1.join(core_1.normalize('dist'), options.appProjectRoot),
            package: core_1.join(core_1.normalize('dist'), options.appProjectRoot)
        }
    };
}
function updateWorkspaceJson(options) {
    return workspace_1.updateWorkspaceInTree(workspaceJson => {
        const project = workspaceJson.projects[options.project];
        const buildConfig = utils_1.getBuildConfig(options);
        buildConfig.options['skipClean'] = true;
        buildConfig.options['outputPath'] = core_1.normalize('dist');
        buildConfig.options['tsConfig'] = core_1.join(options.appProjectRoot, 'tsconfig.serverless.json');
        buildConfig.builder = '@flowaccount/nx-serverless:compile';
        project.architect.compile = buildConfig;
        project.architect.offline = getServeConfig(options);
        project.architect.deploy = getDeployConfig(options);
        project.architect.destroy = getDestroyConfig(options);
        if (options.addUniversal) {
            project.architect.server.options.outputPath = core_1.join(core_1.normalize('dist'), options.appProjectRoot, 'server');
            // project.architect.server.configurations.production.fileReplacements[0].replace = join(options.appProjectRoot, 'environment.ts'),
            // project.architect.server.configurations.production.fileReplacements[0].with = join(options.appProjectRoot, 'environment.prod.ts'),
            project.architect.build.options.outputPath = core_1.join(core_1.normalize('dist'), options.appProjectRoot, 'browser');
        }
        workspaceJson.projects[options.project] = project;
        return workspaceJson;
    });
}
function addAppFiles(options) {
    return schematics_1.mergeWith(schematics_1.apply(schematics_1.url('./files/app'), [
        schematics_1.template({
            tmpl: '',
            name: options.project,
            root: options.appProjectRoot,
            offset: workspace_2.offsetFromRoot(options.appProjectRoot)
        }),
        schematics_1.move(options.appProjectRoot)
    ]));
}
function updateServerTsFile(options) {
    return (host, context) => {
        const modulePath = `${options.appProjectRoot}/server.ts`;
        const content = host.read(modulePath);
        let moduleSource = '';
        if (!content) {
            context.logger.error('Cannot find server.ts to replace content!');
            return host;
        }
        moduleSource = content.toString('utf-8');
        const tsSourceFile = ts.createSourceFile(core_1.join(options.appProjectRoot, 'server.ts'), moduleSource, ts.ScriptTarget.Latest, true);
        context.logger.info('updating server.ts to support serverless-express and production mode.');
        host.overwrite(modulePath, moduleSource.replace(`join(process.cwd(), 'dist/${options.project}/browser')`, `environment.production ? join(process.cwd(), './browser') : join(process.cwd(), 'dist/${options.appProjectRoot}/browser')`));
        ast_utils_1.insert(host, modulePath, [
            ast_utils_1.insertImport(tsSourceFile, modulePath, 'environment', './src/environments/environment')
        ]);
        return host;
    };
}
function addServerlessYMLFile(options) {
    return (host) => {
        host.create(core_1.join(options.appProjectRoot, 'serverless.yml'), `service: ${options.project}
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
function normalizeOptions(project, options) {
    return Object.assign(Object.assign({}, options), { appProjectRoot: project.root });
}
function default_1(schema) {
    return (host, context) => {
        const project = workspace_1.getProjectConfig(host, schema.project);
        const options = normalizeOptions(project, schema);
        return schematics_1.chain([
            init_1.default({
                skipFormat: options.skipFormat,
                expressProxy: true
            }),
            options.addUniversal
                ? schematics_1.externalSchematic('@nguniversal/express-engine', 'ng-add', {
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
                : schematics_1.noop(),
            addAppFiles(options),
            addServerlessYMLFile(options),
            options.addUniversal ? updateServerTsFile(options) : schematics_1.noop(),
            updateWorkspaceJson(options)
        ])(host, context);
    };
}
exports.default = default_1;
//# sourceMappingURL=application.js.map