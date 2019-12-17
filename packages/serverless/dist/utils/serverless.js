"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Serverless = require("serverless/lib/Serverless");
const architect_1 = require("@angular-devkit/architect");
const from_1 = require("rxjs/internal/observable/from");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
class ServerlessWrapper {
    constructor() {
    }
    static get serverless() {
        if (this.serverless$ === null) {
            throw new Error("Please initialize serverless before usage, or pass option for initialization.");
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
            }), operators_1.tap((options) => {
                this.serverless$ = new Serverless({ config: options.serverlessConfig, servicePath: options.servicePath });
                this.serverless$.init();
                this.serverless$.cli.asciiGreeting();
            }));
        }
        else {
            return rxjs_1.of(null);
        }
    }
}
ServerlessWrapper.serverless$ = null;
exports.ServerlessWrapper = ServerlessWrapper;
