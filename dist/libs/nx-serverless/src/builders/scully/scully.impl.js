"use strict";
// npx scully --nw --configFile apps/frontend/flowaccount-landing/scully.config.js --removeStaticDist
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const target_schedulers_1 = require("../../utils/target.schedulers");
exports.default = architect_1.createBuilder(scullyCmdRunner);
function scullyCmdRunner(options, context) {
    //
    if (options.skipBuild) {
        return runScully(options, context).pipe(operators_1.concatMap(result => {
            return result.output;
        }));
    }
    else {
        return target_schedulers_1.startBuild(options, context).pipe(operators_1.concatMap(v => {
            if (!v.success) {
                context.logger.error('Build target failed!');
                return rxjs_1.of({ success: false });
            }
            return runScully(options, context);
        }), operators_1.concatMap((result) => {
            return result.output;
        }));
    }
}
exports.scullyCmdRunner = scullyCmdRunner;
function runScully(options, context) {
    const commands = [];
    const args = getExecArgv(options);
    options.configFiles.forEach(fileName => {
        commands.push({
            command: `scully --configFile=${fileName} ${args.join(' ')}`
        });
    });
    return rxjs_1.from(context.scheduleBuilder('@nrwl/workspace:run-commands', {
        commands: commands,
        cwd: options.root,
        color: true,
        parallel: false
    }));
}
function getExecArgv(options) {
    const args = [];
    const keys = Object.keys(options);
    keys.forEach(key => {
        if (options[key] !== undefined &&
            key !== 'buildTarget' &&
            key != 'configFiles' &&
            key != 'skipBuild') {
            // if(typeof(options[key]) == 'boolean') {
            //   args.push(`--${key}`);
            // } else {
            args.push(`--${key}=${options[key]}`);
            // }
        }
    });
    return args;
}
//# sourceMappingURL=scully.impl.js.map