"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
function getBuildConfig(options) {
    return {
        builder: '@flowaccount/nx-serverless:build',
        options: {
            outputPath: core_1.join(core_1.normalize('dist'), options.appProjectRoot),
            package: options.appProjectRoot,
            serverlessConfig: core_1.join(options.appProjectRoot, 'serverless.yml'),
            servicePath: options.appProjectRoot,
            tsConfig: core_1.join(options.appProjectRoot, 'tsconfig.app.json'),
            provider: options.provider,
            processEnvironmentFile: 'env.json'
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
                        replace: core_1.join(options.appProjectRoot, 'environment.ts'),
                        with: core_1.join(options.appProjectRoot, 'environment.prod.ts')
                    }
                ]
            }
        }
    };
}
exports.getBuildConfig = getBuildConfig;
//# sourceMappingURL=utils.js.map