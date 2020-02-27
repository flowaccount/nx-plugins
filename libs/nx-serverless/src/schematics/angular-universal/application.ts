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
import { join, normalize, Path } from '@angular-devkit/core';
import { Schema } from './schema';
import {
    updateWorkspaceInTree,
    getProjectConfig

} from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/workspace';
import init from '../init/init';

interface NormalizedSchema extends Schema {
    appProjectRoot: Path
}

function getBuildConfig(options: NormalizedSchema) {
    return {
        builder: '@flowaccount/nx-serverless:build',
        options: {
            outputPath: join(normalize('dist'), options.appProjectRoot),
            package: options.appProjectRoot,
            serverlessConfig: join(options.appProjectRoot, 'serverless.yml'),
            servicePath: options.appProjectRoot,
            tsConfig: join(options.appProjectRoot, 'tsconfig.app.json'),
            provider: options.provider,
            watch: true,
            progress: true
        },
        configurations: {
            dev: {
                optimization: false,
                sourceMap: false,
                budgets: [
                    {
                        type: 'initial',
                        maximumWarning: '2mb',
                        maximumError: '5mb'
                    }
                ]
            },
            production: {
                optimization: true,
                sourceMap: false,
                extractCss: true,
                namedChunks: false,
                extractLicenses: true,
                vendorChunk: false,
                budgets: [
                    {
                        type: 'initial',
                        maximumWarning: '2mb',
                        maximumError: '5mb'
                    }
                ],
                fileReplacements: [
                    {
                        replace: join(options.appProjectRoot, 'environment.ts'),
                        with: join(options.appProjectRoot, 'environment.prod.ts')
                    }
                ]
            }
        }
    };
}

function getServeConfig(options: NormalizedSchema) {
    return {
        builder: '@flowaccount/nx-serverless:offline',
        options: {
            waitUntilTargets: [
                options.project + ':build:production',
                options.project + ':server',
            ],
            buildTarget: options.project + ':build',
            config: join(options.appProjectRoot, 'serverless.yml'),
            location: join(normalize('dist'), options.appProjectRoot)
        },
        configurations: {
            dev: {
                buildTarget: options.project + ':build:dev'
            },
            production: {
                buildTarget: options.project + ':build:production'
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
                options.project + ':server',
            ],
            buildTarget: options.project + ':serverless:production',
            config: join(options.appProjectRoot, 'serverless.yml'),
            location: join(normalize('dist'), options.appProjectRoot),
            package: join(normalize('dist'), options.appProjectRoot)
        }
    };
}

function updateWorkspaceJson(options: NormalizedSchema): Rule {
    return updateWorkspaceInTree(workspaceJson => {
        const project = workspaceJson.projects[options.project]
        project.architect.buildServerless = getBuildConfig(options);
        project.architect.offline = getServeConfig(options);
        project.architect.deploy = getDeployConfig(options);
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

function addServerlessYMLFile(options: NormalizedSchema): Rule {
    return (host: Tree) => {
        host.create(
            join(options.appProjectRoot, 'serverless.yml'),
            `service: ${options.project}
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
  memorySize: 192
  timeout: 10
custom:
  apigwBinary:
    types:
      - '*/*'
functions:
  web-app:
    handler: src/handler.webApp
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

export default function (schema: Schema): Rule {
    return (host: Tree, context: SchematicContext) => {
        const project = getProjectConfig(host, schema.project);
        const options = normalizeOptions(project, schema);
        return chain([
            init({
                skipFormat: options.skipFormat,
                universalApp: true
            }),
            options.addUniversal ? externalSchematic('@nguniversal/express-engine', 'ng-add', {
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
            }) : noop(),
            addAppFiles(options),
            addServerlessYMLFile(options),
            updateWorkspaceJson(options),
        ])(host, context);
    }
}
