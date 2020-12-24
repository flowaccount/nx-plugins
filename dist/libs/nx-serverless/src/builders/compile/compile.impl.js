"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const typescript_1 = require("../../utils/typescript");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const normalize_1 = require("../../utils/normalize");
const serverless_1 = require("../../utils/serverless");
const path_1 = require("path");
exports.default = architect_1.createBuilder(run);
function run(options, context) {
    return rxjs_1.from(normalize_1.getSourceRoot(context)).pipe(operators_1.map(sourceRoot => normalize_1.normalizeBuildOptions(options, context.workspaceRoot, path_1.join(context.workspaceRoot, sourceRoot))), operators_1.switchMap(options => rxjs_1.combineLatest(rxjs_1.of(options), rxjs_1.from(serverless_1.ServerlessWrapper.init(options, context)))), operators_1.map(([options]) => {
        return normalize_1.assignEntriesToFunctionsFromServerless(options, context.workspaceRoot);
    }), operators_1.concatMap(options => {
        context.logger.info('start compiling typescript');
        return typescript_1.compileTypeScriptFiles(options, context
        // libDependencies
        );
    }), operators_1.map((value) => {
        return Object.assign(Object.assign({}, value), { outfile: path_1.resolve(context.workspaceRoot, options.outputPath), resolverName: 'DependencyCheckResolver', tsconfig: path_1.resolve(context.workspaceRoot, options.tsConfig) });
    }));
}
exports.run = run;
//# sourceMappingURL=compile.impl.js.map