"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isBuiltinModule = require("is-builtin-module");
const _ = require("lodash");
const normalize_1 = require("./normalize");
const rxjs_1 = require("rxjs");
class WebpackDependencyResolver {
    constructor(context) {
        this.context = context;
    }
    normalizeExternalDependencies(packageJson, originPackageJsonPath, verbose, webpackStats, dependencyGraph, sourceRoot, tsconfig) {
        const externals = this.getExternalModules(webpackStats);
        if (!dependencyGraph || dependencyGraph === null) {
            dependencyGraph = {};
        }
        const prodModules = rxjs_1.of(normalize_1.getProdModules(externals, packageJson, originPackageJsonPath, [], dependencyGraph, verbose));
        return prodModules;
    }
    isExternalModule(module) {
        return (_.startsWith(module.identifier, 'external ') &&
            !isBuiltinModule(this.getExternalModuleName(module)));
    }
    getExternalModuleName(module) {
        const path = /^external "(.*)"$/.exec(module.identifier)[1];
        const pathComponents = path.split('/');
        const main = pathComponents[0];
        // this is a package within a namespace
        if (main.charAt(0) == '@') {
            return `${main}/${pathComponents[1]}`;
        }
        return main;
    }
    getExternalModules(stats) {
        if (!stats.chunks) {
            return [];
        }
        const externals = new Set();
        for (const chunk of stats.chunks) {
            if (!chunk.modules) {
                continue;
            }
            // Explore each module within the chunk (built inputs):
            for (const module of chunk.modules) {
                if (this.isExternalModule(module)) {
                    externals.add({
                        origin: module.issuer,
                        external: this.getExternalModuleName(module)
                    });
                }
            }
        }
        return Array.from(externals);
    }
}
exports.WebpackDependencyResolver = WebpackDependencyResolver;
//# sourceMappingURL=webpack.stats.js.map