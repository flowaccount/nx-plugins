"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const node_config_1 = require("../../utils/node.config");
const normalize_1 = require("../../utils/normalize");
const serverless_1 = require("../../utils/serverless");
// import { wrapMiddlewareBuildOptions } from '../../utils/middleware';
const path_1 = require("path");
const serverless_config_1 = require("../../utils/serverless.config");
const copy_asset_files_1 = require("../../utils/copy-asset-files");
function run(options, context) {
    return rxjs_1.from(normalize_1.getSourceRoot(context)).pipe(operators_1.map(sourceRoot => normalize_1.normalizeBuildOptions(options, context.workspaceRoot, sourceRoot)), operators_1.switchMap(options => rxjs_1.combineLatest(rxjs_1.of(options), rxjs_1.from(serverless_1.ServerlessWrapper.init(options, context)))), operators_1.map(([options]) => {
        return normalize_1.assignEntriesToFunctionsFromServerless(options, context.workspaceRoot);
    }), operators_1.map(options => {
        options.tsConfig = serverless_config_1.consolidateExcludes(options, context);
        options.entry = options.files;
        console.log(options.tsConfig);
        let config = node_config_1.getNodeWebpackConfig(options);
        if (options.webpackConfig) {
            config = require(options.webpackConfig)(config, {
                options,
                configuration: context.target.configuration
            });
        }
        operators_1.tap(() => copy_asset_files_1.default(options, context));
        return config;
    }), operators_1.concatMap(config => {
        serverless_1.ServerlessWrapper.serverless.cli.log('start compiling webpack');
        return build_webpack_1.runWebpack(config, context, {
            logging: stats => {
                context.logger.info(stats.toString(config.stats));
            }
        });
    }), operators_1.map((buildEvent) => {
        buildEvent.outfile = path_1.resolve(context.workspaceRoot, options.outputPath);
        buildEvent.resolverName = 'WebpackDependencyResolver';
        return buildEvent;
    }));
}
exports.default = architect_1.createBuilder(run);
//# sourceMappingURL=build.impl.js.map