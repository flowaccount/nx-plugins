"use strict";
/**
 * Factory for supported packagers.
 *
 * All packagers must implement the following interface:
 *
 * interface Packager {
 *
 * static get lockfileName(): string;
 * static get copyPackageSectionNames(): Array<string>;
 * static get mustCopyModules(): boolean;
 * static getProdDependencies(cwd: string, depth: number = 1): BbPromise<Object>;
 * static rebaseLockfile(pathToPackageRoot: string, lockfile: Object): void;
 * static install(cwd: string): BbPromise<void>;
 * static prune(cwd: string): BbPromise<void>;
 * static runScripts(cwd: string, scriptNames): BbPromise<void>;
 *
 * }
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const npm_1 = require("./npm");
const yarn_1 = require("./yarn");
const normalize_1 = require("../normalize");
const workspace_1 = require("@nrwl/workspace");
const fileutils_1 = require("@nrwl/workspace/src/utils/fileutils");
const webpack_stats_1 = require("../webpack.stats");
const depcheck_1 = require("../depcheck");
const serverless_1 = require("../serverless");
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const path_1 = require("path");
const registeredPackagers = {
    npm: npm_1.NPM,
    yarn: yarn_1.Yarn
};
/**
 * Factory method.
 * @this ServerlessWebpack - Active plugin instance
 * @param {string} packagerId - Well known packager id.
 */
function packager(packagerId) {
    if (!_.has(registeredPackagers, packagerId)) {
        const message = `Could not find packager '${packagerId}'`;
        throw message;
    }
    return registeredPackagers[packagerId];
}
exports.packager = packager;
function preparePackageJson(options, context, stats, resolverName, tsconfig) {
    const resolver = resolverFactory(resolverName, context);
    context.logger.info('getting external modules');
    const workspacePackageJsonPath = path_1.join(context.workspaceRoot, 'package.json');
    const packageJsonPath = path_1.join(options.package, 'package.json');
    const packageJson = workspace_1.readJsonFile(workspacePackageJsonPath);
    context.logger.info('create a package.json with first level dependencies'); //First create a package.json with first level dependencies
    // Get the packager for the current process.
    let packagerInstance = null;
    if (packager('yarn')) {
        packagerInstance = yarn_1.Yarn;
    }
    else if (packager('npm')) {
        packagerInstance = npm_1.NPM;
    }
    else {
        return rxjs_1.of({
            success: false,
            error: 'No Packager to process package.json, please install npm or yarn'
        });
    }
    let dependencyGraph = null;
    // Get the packager for the current process.
    return rxjs_1.from(normalize_1.getProjectRoot(context)).pipe(operators_1.switchMap(root => {
        options.root = path_1.join(context.workspaceRoot, root);
        return resolver.normalizeExternalDependencies(packageJson, workspacePackageJsonPath, options.verbose, stats, {}, options.root, tsconfig);
    }), operators_1.concatMap((prodModules) => {
        createPackageJson(prodModules, packageJsonPath, workspacePackageJsonPath);
        //got to generate lock entry for yarn for dependency graph to work.
        if (packager('yarn')) {
            context.logger.info('generate lock entry for yarn for dependency graph to work.');
            const result = packagerInstance.generateLockFile(path_1.dirname(packageJsonPath));
            if (result.error) {
                context.logger.error('ERROR: generating lock file!');
                return rxjs_1.of({ success: false, error: result.error.toString() });
            }
            fileutils_1.writeToFile(path_1.join(options.package, packagerInstance.lockfileName), result.stdout.toString());
        }
        // Get the packagelist with dependency graph and depth=2 level
        // review: Change depth to options?
        // review: Should I change everything to spawnsync for the pacakagers?
        context.logger.info('get the packagelist with dependency graph and depth=2 level');
        const getDependenciesResult = packagerInstance.getProdDependencies(path_1.dirname(packageJsonPath), 1, 4);
        if (getDependenciesResult.error) {
            context.logger.error('ERROR: getDependenciesResult!');
            return rxjs_1.of({
                success: false,
                error: getDependenciesResult.error.toString()
            });
        }
        const data = getDependenciesResult.stdout.toString();
        if (packager('yarn')) {
            dependencyGraph = convertDependencyTrees(JSON.parse(data.toString()));
        }
        else if (packager('npm')) {
            dependencyGraph = JSON.parse(data.toString());
        }
        const problems = _.get(dependencyGraph, 'problems', []);
        if (options.verbose && !_.isEmpty(problems)) {
            context.logger.info(`Ignoring ${_.size(problems)} NPM errors:`);
            _.forEach(problems, problem => {
                context.logger.info(`=> ${problem}`);
            });
        }
        // re-writing package.json with dependency-graphs
        context.logger.info('re-writing package.json with dependency-graphs');
        return resolver.normalizeExternalDependencies(packageJson, workspacePackageJsonPath, options.verbose, stats, dependencyGraph, options.root, tsconfig);
    }), operators_1.concatMap((prodModules) => {
        createPackageJson(prodModules, packageJsonPath, workspacePackageJsonPath);
        // run packager to  install node_modules
        context.logger.info('run packager to  install node_modules');
        const packageInstallResult = packagerInstance.install(path_1.dirname(packageJsonPath), { ignoreScripts: options.ignoreScripts });
        if (packageInstallResult.error) {
            context.logger.error('ERROR: install package error!');
            return rxjs_1.of({
                success: false,
                error: packageInstallResult.error.toString()
            });
        }
        context.logger.info(packageInstallResult.stdout.toString());
        return rxjs_1.of({ success: true });
    }));
}
exports.preparePackageJson = preparePackageJson;
function resolverFactory(resolverName, context) {
    // Dont know how to reflect class using type string???
    // const resolver = Object.create(window[resolverName].prototype);
    if (resolverName === 'WebpackDependencyResolver') {
        return new webpack_stats_1.WebpackDependencyResolver(context);
    }
    else if (resolverName === 'DependencyCheckResolver') {
        return new depcheck_1.DependencyCheckResolver(context);
    }
    else {
        throw `Resolver ${resolverName} does not exists`;
    }
}
function convertDependencyTrees(parsedTree) {
    const convertTrees = trees => _.reduce(trees, (__, tree) => {
        const splitModule = _.split(tree.name, '@');
        // If we have a scoped module we have to re-add the @
        if (_.startsWith(tree.name, '@')) {
            splitModule.splice(0, 1);
            splitModule[0] = '@' + splitModule[0];
        }
        __[_.first(splitModule)] = {
            version: _.join(_.tail(splitModule), '@'),
            dependencies: convertTrees(tree.children)
        };
        return __;
    }, {});
    const trees = _.get(parsedTree, 'data.trees', []);
    const result = {
        problems: [],
        dependencies: convertTrees(trees)
    };
    return result;
}
function createPackageJson(externalModules, packageJsonPath, pathToPackageRoot) {
    const compositePackage = _.defaults({
        name: serverless_1.ServerlessWrapper.serverless.service.service,
        version: '1.0.0',
        description: `Packaged externals for ${serverless_1.ServerlessWrapper.serverless.service.service}`,
        private: true,
        scripts: {
            'package-yarn': 'yarn',
            'package-npm': 'npm install'
        }
    }, {});
    addModulesToPackageJson(externalModules, compositePackage, pathToPackageRoot); // for rebase , relPath
    fileutils_1.writeJsonFile(packageJsonPath, compositePackage);
}
function addModulesToPackageJson(externalModules, packageJson, pathToPackageRoot) {
    // , pathToPackageRoot
    _.forEach(externalModules, externalModule => {
        const splitModule = _.split(externalModule, '@');
        // If we have a scoped module we have to re-add the @
        if (_.startsWith(externalModule, '@')) {
            splitModule.splice(0, 1);
            splitModule[0] = '@' + splitModule[0];
        }
        let moduleVersion = _.join(_.tail(splitModule), '@');
        // We have to rebase file references to the target package.json
        moduleVersion = rebaseFileReferences(pathToPackageRoot, moduleVersion);
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies[_.first(splitModule)] = moduleVersion;
    });
}
function rebaseFileReferences(pathToPackageRoot, moduleVersion) {
    if (/^(?:file:[^/]{2}|\.\/|\.\.\/)/.test(moduleVersion)) {
        const filePath = _.replace(moduleVersion, /^file:/, '');
        return _.replace(`${_.startsWith(moduleVersion, 'file:') ? 'file:' : ''}${pathToPackageRoot}/${filePath}`, /\\/g, '/');
    }
    if (moduleVersion === '') {
        moduleVersion = '*';
    }
    return moduleVersion;
}
//# sourceMappingURL=index.js.map