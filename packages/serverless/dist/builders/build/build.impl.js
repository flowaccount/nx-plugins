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
const core_1 = require("@angular-devkit/core");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const node_1 = require("@angular-devkit/core/node");
const node_config_1 = require("../../utils/node.config");
const normalize_1 = require("../../utils/normalize");
const serverless_1 = require("../../utils/serverless");
const middleware_1 = require("../../utils/middleware");
exports.default = architect_1.createBuilder(run);
function run(options, context) {
    return serverless_1.ServerlessWrapper.init(options, context)
        .pipe(operators_1.mergeMap(() => rxjs_1.from(middleware_1.wrapMiddlewareBuildOptions(options))), operators_1.mergeMap(() => rxjs_1.from(getSourceRoot(context))), operators_1.switchMap(sourceRoot => rxjs_1.from(normalize_1.normalizeBuildOptions(options, context.workspaceRoot, sourceRoot))), operators_1.map(options => {
        let config = node_config_1.getNodeWebpackConfig(options);
        if (options.webpackConfig) {
            config = require(options.webpackConfig)(config, {
                options,
                configuration: context.target.configuration
            });
        }
        return config;
    }), operators_1.concatMap(config => {
        serverless_1.ServerlessWrapper.serverless.cli.log("start compiling webpack");
        return build_webpack_1.runWebpack(config, context, {
            logging: stats => {
                context.logger.info(stats.toString(config.stats));
            }
        });
    }), operators_1.map((buildEvent) => {
        buildEvent.outfile = options.outputPath;
        return buildEvent;
    }));
}
function getSourceRoot(context) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspaceHost = core_1.workspaces.createWorkspaceHost(new node_1.NodeJsSyncHost());
        const { workspace } = yield core_1.workspaces.readWorkspace(context.workspaceRoot, workspaceHost);
        if (workspace.projects.get(context.target.project).sourceRoot) {
            return workspace.projects.get(context.target.project).sourceRoot;
        }
        else {
            context.reportStatus('Error');
            const message = `${context.target.project} does not have a sourceRoot. Please define one.`;
            context.logger.error(message);
            throw new Error(message);
        }
    });
}
