"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const serverless_1 = require("../../utils/serverless");
const target_schedulers_1 = require("../../utils/target.schedulers");
exports.default = architect_1.createBuilder(serverlessExecutionHandler);
function serverlessExecutionHandler(options, context) {
    return target_schedulers_1.startBuild(options, context).pipe(operators_1.concatMap((event) => {
        if (event.success) {
            // build into output path before running serverless offline.
            const servicePath = serverless_1.ServerlessWrapper.serverless.config.servicePath;
            serverless_1.ServerlessWrapper.serverless.config.servicePath = options.location;
            serverless_1.ServerlessWrapper.serverless.processedInput = {
                commands: ['remove'],
                options: getExecArgv(options)
            };
            return new rxjs_1.Observable(option => {
                serverless_1.ServerlessWrapper.serverless
                    .run()
                    .then(() => {
                    // change servicePath back for further processing.
                    serverless_1.ServerlessWrapper.serverless.config.servicePath = servicePath;
                    option.next({ success: true });
                    option.complete();
                })
                    .catch(ex => {
                    option.next({ success: false, error: ex.toString() });
                    option.complete();
                });
            }).pipe(operators_1.concatMap(result => {
                return rxjs_1.of(result);
            }));
        }
        else {
            context.logger.error('There was an error with the build. See above.');
            context.logger.info(`${event.outfile} was not restarted.`);
            return rxjs_1.of({
                success: false,
                error: `${event.outfile} was not restarted.`
            });
        }
    }));
}
exports.serverlessExecutionHandler = serverlessExecutionHandler;
function getExecArgv(options) {
    const args = [];
    if (options.function && options.function != '') {
        args.push('function');
    }
    if (options.list) {
        args.push('list');
    }
    for (const key in options) {
        if (options.hasOwnProperty(key)) {
            if (options[key] !== undefined &&
                key !== 'buildTarget' &&
                key !== 'package' &&
                key !== 'list') {
                args.push(`--${key}=${options[key]}`);
            }
        }
    }
    return args;
}
exports.getExecArgv = getExecArgv;
//# sourceMappingURL=destroy.impl.js.map