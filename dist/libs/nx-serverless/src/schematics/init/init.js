"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@nrwl/workspace");
const versions_1 = require("../../utils/versions");
function addDependencies(expressProxy) {
    return (host, context) => {
        const dependencies = {};
        const devDependencies = {
            '@flowaccount/nx-serverless': versions_1.nxVersion,
            serverless: versions_1.serverlessVersion,
            'serverless-offline': versions_1.serverlessOfflineVersion
        };
        if (expressProxy) {
            dependencies['aws-serverless-express'] = versions_1.awsServerlessExpressVersion;
            dependencies['express'] = versions_1.expressVersion;
            devDependencies['@types/aws-serverless-express'] = versions_1.awsServerlessExpressVersion;
            devDependencies['serverless-apigw-binary'] = versions_1.serverlessApigwBinaryVersion;
        }
        else {
            devDependencies['@types/aws-lambda'] = versions_1.awsTypeLambdaVersion;
        }
        const packageJson = workspace_1.readJsonInTree(host, 'package.json');
        Object.keys(dependencies).forEach(key => {
            if (packageJson.dependencies[key]) {
                delete dependencies[key];
            }
        });
        Object.keys(devDependencies).forEach(key => {
            if (packageJson.devDependencies[key]) {
                delete devDependencies[key];
            }
        });
        if (!Object.keys(dependencies).length &&
            !Object.keys(devDependencies).length) {
            context.logger.info('Skipping update package.json');
            return schematics_1.noop();
        }
        return workspace_1.addDepsToPackageJson(dependencies, devDependencies);
    };
}
function updateDependencies() {
    return workspace_1.updateJsonInTree('package.json', json => {
        if (json.dependencies['@flowaccount/nx-serverless']) {
            json.devDependencies['@flowaccount/nx-serverless'] =
                json.dependencies['@flowaccount/nx-serverless'];
            delete json.dependencies['@flowaccount/nx-serverless'];
        }
        else if (!json.devDependencies['@flowaccount/nx-serverless']) {
            json.devDependencies['@flowaccount/nx-serverless'] = versions_1.nxVersion;
        }
        return json;
    });
}
function default_1(schema) {
    return schematics_1.chain([
        workspace_1.addPackageWithInit('@nrwl/jest'),
        addDependencies(schema.expressProxy),
        updateDependencies(),
        workspace_1.formatFiles(schema)
    ]);
}
exports.default = default_1;
//# sourceMappingURL=init.js.map