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
const operators_1 = require("rxjs/operators");
const literals_1 = require("@angular-devkit/core/src/utils/literals");
const child_process_1 = require("child_process");
const treeKill = require("tree-kill");
try {
    require('dotenv').config();
}
catch (e) { }
exports.default = architect_1.createBuilder(serverlessExecutionHandler);
let subProcess = null;
function serverlessExecutionHandler(options, context) {
    return runWaitUntilTargets(options, context).pipe(operators_1.concatMap(v => {
        if (!v.success) {
            context.logger.error(`One of the tasks specified in waitUntilTargets failed`);
            return rxjs_1.of({ success: false });
        }
        // build into output path before running serverless offline.
        return startBuild(options, context).pipe(operators_1.concatMap((event) => {
            if (event.success) {
                return restartProcess(event.outfile, options, context).pipe(operators_1.mapTo(event));
            }
            else {
                context.logger.error('There was an error with the build. See above.');
                context.logger.info(`${event.outfile} was not restarted.`);
                return rxjs_1.of(event);
            }
        }));
    }));
}
exports.serverlessExecutionHandler = serverlessExecutionHandler;
function runProcess(file, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (subProcess) {
            throw new Error('Already running');
        }
        subProcess = child_process_1.fork("node_modules/serverless/bin/serverless.js", getExecArgv(options));
    });
}
function startBuild(options, context) {
    const target = architect_1.targetFromTargetString(options.buildTarget);
    return rxjs_1.from(Promise.all([
        context.getTargetOptions(target),
        context.getBuilderNameForTarget(target)
    ]).then(([options, builderName]) => context.validateOptions(options, builderName))).pipe(operators_1.tap(options => {
        if (options.optimization) {
            context.logger.warn(literals_1.stripIndents `
              ************************************************
              This is a simple process manager for use in
              testing or debugging Node applications locally.
              DO NOT USE IT FOR PRODUCTION!
              You should look into proper means of deploying
              your node application to production.
              ************************************************`);
        }
    }), operators_1.concatMap(() => architect_1.scheduleTargetAndForget(context, target, {
        watch: true
    })));
}
function getExecArgv(options) {
    const args = ['-r', 'source-map-support/register'];
    if (options.inspect === true) {
        options.inspect = "inspect" /* Inspect */;
    }
    if (options.inspect) {
        args.push(`--${options.inspect}=${options.host}:${options.port}`);
    }
    args.push("offline");
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            if (options[key] !== undefined) {
                args.push(`--${key}=${options[key]}`);
            }
        }
    }
    return args;
}
function restartProcess(file, options, context) {
    return killProcess(context).pipe(operators_1.tap(() => {
        runProcess(file, options);
    }));
}
function killProcess(context) {
    if (!subProcess) {
        return rxjs_1.of(undefined);
    }
    const observableTreeKill = rxjs_1.bindCallback(treeKill);
    return observableTreeKill(subProcess.pid, 'SIGTERM').pipe(operators_1.tap(err => {
        subProcess = null;
        if (err) {
            if (Array.isArray(err) && err[0] && err[2]) {
                const errorMessage = err[2];
                context.logger.error(errorMessage);
            }
            else if (err.message) {
                context.logger.error(err.message);
            }
        }
    }));
}
function runWaitUntilTargets(options, context) {
    if (!options.waitUntilTargets || options.waitUntilTargets.length === 0)
        return rxjs_1.of({ success: true });
    return rxjs_1.zip(...options.waitUntilTargets.map(b => {
        return architect_1.scheduleTargetAndForget(context, architect_1.targetFromTargetString(b)).pipe(operators_1.filter(e => e.success !== undefined), operators_1.first());
    })).pipe(operators_1.map(results => {
        return { success: !results.some(r => !r.success) };
    }));
}
