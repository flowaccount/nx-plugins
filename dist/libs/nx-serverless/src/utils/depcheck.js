"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const depcheck = require("depcheck");
const workspace_1 = require("@nrwl/workspace");
const normalize_1 = require("./normalize");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
class DependencyCheckResolver {
    constructor(context) {
        this.context = context;
        this.options = {
            ignoreBinPackage: false,
            skipMissing: false,
            ignoreDirs: [
                // folder with these names will be ignored
                'sandbox',
                'dist',
                'bower_components'
            ],
            ignoreMatches: [
                // ignore dependencies that matches these globs
                'grunt-*'
            ],
            parsers: {},
            detectors: [
                // the target detectors
                depcheck.detector.requireCallExpression,
                depcheck.detector.importDeclaration
            ],
            specials: [
                // the target special parsers
                depcheck.special.eslint,
                depcheck.special.webpack
            ],
            package: {}
        };
    }
    normalizeExternalDependencies(packageJson, originPackageJsonPath, verbose, webpackStats, dependencyGraph, sourceRoot, tsconfig) {
        return this.dependencyCheck(packageJson, sourceRoot, tsconfig).pipe(operators_1.map((result) => {
            if (!dependencyGraph || dependencyGraph === null) {
                dependencyGraph = {};
            }
            const externals = [];
            if (Object.keys(result.invalidFiles).length > 0) {
                throw result.invalidFiles;
            }
            Object.keys(result.missing).forEach(key => {
                this.context.logger.warn(`Missing dependencies ${key} in ${result.missing[key]}`);
            });
            Object.keys(result.using).forEach(key => {
                externals.push({
                    origin: result.using[key],
                    external: key
                });
            });
            return normalize_1.getProdModules(externals, packageJson, originPackageJsonPath, [], dependencyGraph, verbose);
        }));
    }
    dependencyCheck(packageJson, sourceRoot, tsconfig) {
        const tsconfigJson = workspace_1.readJsonFile(tsconfig);
        const parsers = {};
        if (tsconfigJson.files) {
            tsconfigJson.files.forEach(fileName => {
                parsers[fileName] = depcheck.parser.typescript;
            });
        }
        if (tsconfigJson.include) {
            tsconfigJson.include.forEach(includePattern => {
                parsers[includePattern] = depcheck.parser.typescript;
            });
        }
        this.options.parsers = parsers;
        this.options.package = packageJson;
        return rxjs_1.from(depcheck(sourceRoot, this.options));
    }
}
exports.DependencyCheckResolver = DependencyCheckResolver;
//# sourceMappingURL=depcheck.js.map