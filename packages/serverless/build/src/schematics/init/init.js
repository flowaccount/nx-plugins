"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const versions_1 = require("../../utils/versions");
function addDependencies() {
    return workspace_1.addDepsToPackageJson({}, {
        '@nx/serverless': versions_1.nxVersion,
        'serverless': versions_1.serverlessVersion,
        'serverless-dotenv-plugin': versions_1.serverlessDotEnvVersion,
        'serverless-offline': versions_1.serverlessOfflineVersion,
        'serverless-plugin-optimize': versions_1.serverlessOptimizeVersion,
        'serverless-plugin-typescript': versions_1.serverlessTypescriptVersion,
        'aws-sdk': versions_1.awsSdkVersion,
        '@types/aws-lambda': versions_1.awsTypeLambdaVersion,
    });
}
function moveDependency() {
    return workspace_1.updateJsonInTree('package.json', json => {
        json.dependencies = json.dependencies || {};
        delete json.dependencies['@nx/serverless'];
        return json;
    });
}
function setDefault() {
    return workspace_1.updateWorkspace(workspace => {
        workspace.extensions.cli = workspace.extensions.cli || {};
        const defaultCollection = workspace.extensions.cli &&
            workspace.extensions.cli.defaultCollection;
        if (!defaultCollection || defaultCollection === '@nrwl/workspace') {
            workspace.extensions.cli.defaultCollection = '@nx/serverless';
        }
    });
}
function default_1(schema) {
    if (!schema.skipFormat) {
        return schematics_1.chain([
            setDefault(),
            workspace_1.addPackageWithInit('@nrwl/jest'),
            addDependencies(),
            moveDependency(),
            workspace_1.formatFiles(schema)
        ]);
    }
    else {
        return schematics_1.noop();
    }
}
exports.default = default_1;
