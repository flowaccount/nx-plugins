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
const architect_1 = require("@angular-devkit/architect");
const rxjs_1 = require("rxjs");
// import { NodeJsSyncHost } from '@angular-devkit/core/node';
const child_process_1 = require("child_process");
const shared_1 = require("@nrwl/workspace/src/command-line/shared");
exports.default = architect_1.createBuilder(run);
function run(options, context) {
    return rxjs_1.Observable.create((observer) => __awaiter(this, void 0, void 0, function* () {
        try {
            context.logger.warn(options);
            const success = yield runSerially(options, context);
            observer.next({ success });
        }
        catch (e) {
            observer.error(`ERROR: Something went wrong in @nx/serverless - ${e.message}`);
        }
    }));
}
exports.run = run;
function runSerially(options, context) {
    return __awaiter(this, void 0, void 0, function* () {
        const failedCommand = yield createProcess("npm run node_modules\.bin\serverless offline", options.readyWhen ? options.readyWhen : "success", options.arguments);
        if (failedCommand) {
            context.logger.warn(`Warning: @nx/serverless command "${failedCommand}" exited with non-zero status code`);
            return false;
        }
        return true;
    });
}
function createProcess(command, readyWhen, parsedArgs) {
    command = transformCommand(command, parsedArgs);
    return new Promise(res => {
        const childProcess = child_process_1.exec(command, { maxBuffer: shared_1.TEN_MEGABYTES });
        /**
         * Ensure the child process is killed when the parent exits
         */
        process.on('exit', () => childProcess.kill());
        childProcess.stdout.on('data', data => {
            process.stdout.write(data);
            if (readyWhen && data.toString().indexOf(readyWhen) > -1) {
                res(true);
            }
        });
        childProcess.stderr.on('data', err => {
            process.stderr.write(err);
            if (readyWhen && err.toString().indexOf(readyWhen) > -1) {
                res(true);
            }
        });
        childProcess.on('close', code => {
            if (!readyWhen) {
                res(code === 0);
            }
        });
    });
}
function transformCommand(command, args) {
    const regex = /{args\.([^}]+)}/g;
    return command.replace(regex, (_, group) => args[group]);
}
