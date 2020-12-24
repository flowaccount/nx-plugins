"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const literals_1 = require("@angular-devkit/core/src/utils/literals");
function runWaitUntilTargets(waitUntilTargets, context) {
    if (!waitUntilTargets || waitUntilTargets.length === 0)
        return rxjs_1.of({ success: true });
    return rxjs_1.zip(...waitUntilTargets.map(b => {
        return architect_1.scheduleTargetAndForget(context, architect_1.targetFromTargetString(b)).pipe(operators_1.filter(e => e.success !== undefined), operators_1.first());
    })).pipe(operators_1.map(results => {
        return { success: !results.some(r => !r.success) };
    }));
}
exports.runWaitUntilTargets = runWaitUntilTargets;
function startBuild(options, context) {
    const target = architect_1.targetFromTargetString(options.buildTarget);
    return rxjs_1.from(Promise.all([
        context.getTargetOptions(target),
        context.getBuilderNameForTarget(target)
    ]).then(([options, builderName]) => context.validateOptions(options, builderName))).pipe(operators_1.tap(options => {
        context.logger.info(literals_1.stripIndents `
              ************************************************
              This is a custom wrapper of serverless ${context.builder.builderName}
              ************************************************`);
    }), operators_1.concatMap(() => architect_1.scheduleTargetAndForget(context, target, {
        watch: false
    })));
}
exports.startBuild = startBuild;
//# sourceMappingURL=target.schedulers.js.map