"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Serverless = require("serverless/lib/Serverless");
const architect_1 = require("@angular-devkit/architect");
const from_1 = require("rxjs/internal/observable/from");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const path = require("path");
const fs = require("fs");
class ServerlessWrapper {
    constructor() { }
    static get serverless() {
        if (this.serverless$ === null) {
            throw new Error('Please initialize serverless before usage, or pass option for initialization.');
        }
        return this.serverless$;
    }
    static isServerlessDeployBuilderOptions(arg) {
        return arg.buildTarget !== undefined;
    }
    static init(options, context) {
        if (this.serverless$ === null) {
            return from_1.from(Promise.resolve(options)).pipe(operators_1.mergeMap((options) => {
                if (ServerlessWrapper.isServerlessDeployBuilderOptions(options)) {
                    const target = architect_1.targetFromTargetString(options.buildTarget);
                    return from_1.from(Promise.all([
                        context.getTargetOptions(target),
                        context.getBuilderNameForTarget(target)
                    ]).then(([options, builderName]) => {
                        context.validateOptions(options, builderName);
                        return options;
                    }));
                }
                else {
                    return rxjs_1.of(options);
                }
            }), operators_1.concatMap((options) => {
                try {
                    if (fs.existsSync(path.join(options.servicePath, options.processEnvironmentFile))) {
                        require('dotenv-json')({
                            path: path.join(options.servicePath, options.processEnvironmentFile)
                        });
                        context.logger.info(`Environment variables set according to ${options.processEnvironmentFile}`);
                    }
                    else {
                        context.logger.error('No env.json found! no environment will be set!');
                    }
                }
                catch (e) {
                    context.logger.error(e);
                }
                this.serverless$ = new Serverless({
                    config: options.serverlessConfig,
                    servicePath: options.servicePath
                });
                return this.serverless$.init();
            }), operators_1.concatMap(() => {
                return this.serverless$.service.load({
                    config: options.serverlessConfig
                });
            }), operators_1.concatMap(() => {
                this.serverless$.cli.asciiGreeting();
                return rxjs_1.of(null);
            }));
        }
        else {
            return rxjs_1.of(null);
        }
    }
}
exports.ServerlessWrapper = ServerlessWrapper;
ServerlessWrapper.serverless$ = null;
//# sourceMappingURL=serverless.js.map