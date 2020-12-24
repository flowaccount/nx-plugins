"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const serverless_1 = require("./serverless");
function wrapMiddlewareBuildOptions(options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        serverless_1.ServerlessWrapper.serverless.cli.log('getting all functions');
        const functionNames = yield serverless_1.ServerlessWrapper.serverless.service.getAllFunctions();
        functionNames.forEach(name => {
            if (serverless_1.ServerlessWrapper.serverless.service.functions[name]) {
                const fn = serverless_1.ServerlessWrapper.serverless.service.getFunction(name);
                if (!fn.events) {
                    fn.events = [];
                }
                if (options.logGroupName) {
                    fn.events.push({
                        cloudwatchLog: { logGroup: options.logGroupName, filter: '' }
                    });
                }
                serverless_1.ServerlessWrapper.serverless.service.functions[name] = fn;
            }
        });
        return options;
    });
}
exports.wrapMiddlewareBuildOptions = wrapMiddlewareBuildOptions;
//# sourceMappingURL=middleware.js.map