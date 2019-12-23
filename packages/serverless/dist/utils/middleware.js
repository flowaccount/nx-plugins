"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const serverless_1 = require("./serverless");
function wrapMiddlewareBuildOptions(options) {
    return __awaiter(this, void 0, void 0, function* () {
        serverless_1.ServerlessWrapper.serverless.cli.log("getting all functions");
        const functionNames = yield serverless_1.ServerlessWrapper.serverless.service.getAllFunctions();
        console.log(functionNames);
        functionNames.forEach(name => {
            if (serverless_1.ServerlessWrapper.serverless.service.functions[name]) {
                var fn = serverless_1.ServerlessWrapper.serverless.service.getFunction(name);
                if (!fn.events) {
                    fn.events = [];
                }
                if (options.logGroupName) {
                    fn.events.cloudwatchLog = '/aws/lambda/subscription';
                }
                serverless_1.ServerlessWrapper.serverless.service.functions[name] = fn;
                console.log(serverless_1.ServerlessWrapper.serverless.service.functions[name]);
            }
        });
    });
}
exports.wrapMiddlewareBuildOptions = wrapMiddlewareBuildOptions;
