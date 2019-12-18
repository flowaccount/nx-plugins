"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const architect_1 = require("@angular-devkit/architect");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const literals_1 = require("@angular-devkit/core/src/utils/literals");
const isBuiltinModule = require("is-builtin-module");
const _ = require("lodash");
const serverless_1 = require("../../utils/serverless");
const path = require("path");
const index_1 = require("../../utils/packagers/index");
const yarn_1 = require("../../utils/packagers/yarn");
const npm_1 = require("../../utils/packagers/npm");
/* Fix for EMFILE: too many open files on serverless deploy */
const fs = require("fs");
const gracefulFs = require("graceful-fs");
gracefulFs.gracefulify(fs);
/* Fix for EMFILE: too many open files on serverless deploy */
try {
    require('dotenv').config();
}
catch (e) { }
exports.default = architect_1.createBuilder(serverlessExecutionHandler);
function serverlessExecutionHandler(options, context) {
    // build into output path before running serverless offline.
    return serverless_1.ServerlessWrapper.init(options, context).pipe(operators_1.mergeMap(() => {
        return runWaitUntilTargets(options, context).pipe(operators_1.concatMap(v => {
            if (!v.success) {
                context.logger.error(`One of the tasks specified in waitUntilTargets failed`);
                return rxjs_1.of({ success: false });
            }
            return startBuild(options, context);
        }));
    }), operators_1.concatMap((event) => {
        if (event.success) {
            serverless_1.ServerlessWrapper.serverless.cli.log("getting external modules");
            var externals = getExternalModules(event.webpackStats);
            const originPackageJsonPath = path.join('./', 'package.json');
            const packageJsonPath = path.join(options.package, 'package.json');
            const packageJson = serverless_1.ServerlessWrapper.serverless.utils.readFileSync(originPackageJsonPath);
            //First create a package.json with first level dependencies
            serverless_1.ServerlessWrapper.serverless.cli.log("create a package.json with first level dependencies");
            let prodModules = getProdModules(externals, packageJson, originPackageJsonPath, [], {}, options.verbose);
            createPackageJson(prodModules, packageJsonPath, originPackageJsonPath);
            // Get the packager for the current process.
            let packagerInstance = null;
            if (index_1.packager("yarn")) {
                packagerInstance = yarn_1.Yarn;
            }
            else if (index_1.packager("npm")) {
                packagerInstance = npm_1.NPM;
            }
            else {
                return rxjs_1.of({ success: false, error: "No Packager to process package.json, please install npm or yarn" });
            }
            //got to generate lock entry for yarn for dependency graph to work.
            if (index_1.packager("yarn")) {
                serverless_1.ServerlessWrapper.serverless.cli.log("generate lock entry for yarn for dependency graph to work.");
                const result = packagerInstance.generateLockFile(path.dirname(packageJsonPath));
                if (result.error) {
                    serverless_1.ServerlessWrapper.serverless.cli.log("ERROR: generating lock file!");
                    return rxjs_1.of({ success: false, error: result.error.toString() });
                }
                serverless_1.ServerlessWrapper.serverless.utils.writeFileSync(path.join(options.package, packagerInstance.lockfileName), result.stdout.toString());
            }
            // Get the packagelist with dependency graph and depth=2 level
            // review: Change depth to options?
            // review: Should I change everything to spawnsync for the pacakagers?
            serverless_1.ServerlessWrapper.serverless.cli.log("get the packagelist with dependency graph and depth=2 level");
            const getDependenciesResult = packagerInstance.getProdDependencies(path.dirname(packageJsonPath), 1, 4);
            if (getDependenciesResult.error) {
                serverless_1.ServerlessWrapper.serverless.cli.log("ERROR: getDependenciesResult!");
                return rxjs_1.of({ success: false, error: getDependenciesResult.error.toString() });
            }
            let data = getDependenciesResult.stdout.toString();
            let dependencyGraph = null;
            if (index_1.packager("yarn")) {
                dependencyGraph = convertDependencyTrees(JSON.parse(data.toString()));
            }
            else if (index_1.packager("npm")) {
                dependencyGraph = JSON.parse(data.toString());
            }
            const problems = _.get(dependencyGraph, 'problems', []);
            if (options.verbose && !_.isEmpty(problems)) {
                serverless_1.ServerlessWrapper.serverless.cli.log(`Ignoring ${_.size(problems)} NPM errors:`);
                _.forEach(problems, problem => {
                    serverless_1.ServerlessWrapper.serverless.cli.log(`=> ${problem}`);
                });
            }
            // re-writing package.json with dependency-graphs
            serverless_1.ServerlessWrapper.serverless.cli.log("re-writing package.json with dependency-graphs");
            prodModules = getProdModules(externals, packageJson, originPackageJsonPath, [], dependencyGraph, options.verbose);
            createPackageJson(prodModules, packageJsonPath, originPackageJsonPath);
            // run packager to  install node_modules
            serverless_1.ServerlessWrapper.serverless.cli.log("run packager to  install node_modules");
            const packageInstallResult = packagerInstance.install(path.dirname(packageJsonPath), { ignoreScripts: true });
            if (packageInstallResult.error) {
                serverless_1.ServerlessWrapper.serverless.cli.log("ERROR: install package error!");
                return rxjs_1.of({ success: false, error: packageInstallResult.error.toString() });
            }
            serverless_1.ServerlessWrapper.serverless.cli.log(packageInstallResult.stdout.toString());
            // change servicePath to distribution location
            // review: Change options from location to outputpath?\
            const servicePath = serverless_1.ServerlessWrapper.serverless.config.servicePath;
            serverless_1.ServerlessWrapper.serverless.config.servicePath = options.location;
            serverless_1.ServerlessWrapper.serverless.processedInput = { commands: ['deploy'], options: getExecArgv(options) };
            return new rxjs_1.Observable((option) => {
                serverless_1.ServerlessWrapper.serverless.run().then(() => {
                    // change servicePath back for further processing.
                    serverless_1.ServerlessWrapper.serverless.config.servicePath = servicePath;
                    option.next({ success: true });
                    option.complete();
                }).catch(ex => {
                    option.next({ success: false, error: ex.toString() });
                    option.complete();
                });
            }).pipe(operators_1.concatMap((result => {
                return rxjs_1.of(result);
            })));
        }
        else {
            context.logger.error('There was an error with the build. See above.');
            context.logger.info(`${event.outfile} was not restarted.`);
            return rxjs_1.of(event);
        }
    }));
}
exports.serverlessExecutionHandler = serverlessExecutionHandler;
function runWaitUntilTargets(options, context) {
    if (!options.waitUntilTargets || options.waitUntilTargets.length === 0)
        return rxjs_1.of({ success: true });
    return rxjs_1.zip(...options.waitUntilTargets.map(b => {
        return architect_1.scheduleTargetAndForget(context, architect_1.targetFromTargetString(b)).pipe(operators_1.filter(e => e.success !== undefined), operators_1.first());
    })).pipe(operators_1.map(results => {
        return { success: !results.some(r => !r.success) };
    }));
}
/**
 * Remove a given list of excluded modules from a module list
 */
// function removeExcludedModules(modules, packageForceExcludes, log) {
//   const excludedModules = _.remove(modules, externalModule => {   // eslint-disable-line lodash/prefer-immutable-method
//     const splitModule = _.split(externalModule, '@');
//     console.log(splitModule);
//     // If we have a scoped module we have to re-add the @
//     if (_.startsWith(externalModule, '@')) {
//       splitModule.splice(0, 1);
//       splitModule[0] = '@' + splitModule[0];
//     }
//     const moduleName = _.first(splitModule);
//     return _.includes(packageForceExcludes, moduleName);
//   });
//   console.log(excludedModules);
//   if (log && !_.isEmpty(excludedModules)) {
//     ServerlessWrapper.serverless.cli.log(`Excluding external modules: ${_.join(excludedModules, ', ')}`);
//   }
// }
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
;
function startBuild(options, context) {
    const target = architect_1.targetFromTargetString(options.buildTarget);
    return rxjs_1.from(Promise.all([
        context.getTargetOptions(target),
        context.getBuilderNameForTarget(target)
    ]).then(([options, builderName]) => context.validateOptions(options, builderName))).pipe(operators_1.tap(options => {
        if (options.optimization) {
            context.logger.info(literals_1.stripIndents `
              ************************************************
              This is a custom wrapper of serverless deploy
              ************************************************`);
        }
    }), operators_1.concatMap(() => architect_1.scheduleTargetAndForget(context, target, {
        watch: false
    })));
}
function getExecArgv(options) {
    const args = [];
    if (options.function && options.function != '') {
        args.push('function');
    }
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            if (options[key] !== undefined && key !== 'buildTarget' && key !== 'package') {
                args.push(`--${key}=${options[key]}`);
            }
        }
    }
    return args;
}
function createPackageJson(externalModules, packageJsonPath, pathToPackageRoot) {
    const compositePackage = _.defaults({
        name: serverless_1.ServerlessWrapper.serverless.service.service,
        version: '1.0.0',
        description: `Packaged externals for ${serverless_1.ServerlessWrapper.serverless.service.service}`,
        private: true,
        scripts: {
            "package-yarn": "yarn",
            "package-npm": "npm install"
        }
    }, {});
    addModulesToPackageJson(externalModules, compositePackage, pathToPackageRoot); // for rebase , relPath
    serverless_1.ServerlessWrapper.serverless.utils.writeFileSync(packageJsonPath, JSON.stringify(compositePackage, null, 2));
}
function getProdModules(externalModules, packageJson, packagePath, forceExcludes, dependencyGraph, verbose = false) {
    const prodModules = [];
    // only process the module stated in dependencies section
    if (!packageJson.dependencies) {
        return [];
    }
    // Get versions of all transient modules
    _.forEach(externalModules, module => {
        let moduleVersion = packageJson.dependencies[module.external];
        if (moduleVersion) {
            prodModules.push(`${module.external}@${moduleVersion}`);
            // Check if the module has any peer dependencies and include them too
            try {
                const modulePackagePath = path.join(path.dirname(path.join(process.cwd(), packagePath)), 'node_modules', module.external, 'package.json');
                const peerDependencies = require(modulePackagePath).peerDependencies;
                if (!_.isEmpty(peerDependencies)) {
                    verbose && serverless_1.ServerlessWrapper.serverless.cli.log(`Adding explicit peers for dependency ${module.external}`);
                    const peerModules = getProdModules.call(this, _.map(peerDependencies, (value, key) => ({ external: key })), packagePath, dependencyGraph, forceExcludes);
                    Array.prototype.push.apply(prodModules, peerModules);
                }
            }
            catch (e) {
                serverless_1.ServerlessWrapper.serverless.cli.log(`WARNING: Could not check for peer dependencies of ${module.external}`);
            }
        }
        else {
            if (!packageJson.devDependencies || !packageJson.devDependencies[module.external] && dependencyGraph.dependencies) {
                // Add transient dependencies if they appear not in the service's dev dependencies
                const originInfo = _.get(dependencyGraph, 'dependencies', {})[module.external] || {};
                moduleVersion = _.get(originInfo, 'version', null);
                if (!moduleVersion) {
                    serverless_1.ServerlessWrapper.serverless.cli.log(`WARNING: Could not determine version of module ${module.external}`);
                }
                prodModules.push(moduleVersion ? `${module.external}@${moduleVersion}` : module.external);
            }
            else if (packageJson.devDependencies && packageJson.devDependencies[module.external] && !_.includes(forceExcludes, module.external)) {
                // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
                // most likely set in devDependencies and should not lead to an error now.
                const ignoredDevDependencies = ['aws-sdk'];
                if (!_.includes(ignoredDevDependencies, module.external)) {
                    // Runtime dependency found in devDependencies but not forcefully excluded
                    serverless_1.ServerlessWrapper.serverless.cli.log(`ERROR: Runtime dependency '${module.external}' found in devDependencies. Move it to dependencies or use forceExclude to explicitly exclude it.`);
                    throw new serverless_1.ServerlessWrapper.serverless.classes.Error(`Serverless-webpack dependency error: ${module.external}.`);
                }
                verbose && serverless_1.ServerlessWrapper.serverless.cli.log(`INFO: Runtime dependency '${module.external}' found in devDependencies. It has been excluded automatically.`);
            }
        }
    });
    return prodModules;
}
function addModulesToPackageJson(externalModules, packageJson, pathToPackageRoot) {
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
    return moduleVersion;
}
function getExternalModules(stats) {
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
            if (isExternalModule(module)) {
                externals.add({
                    origin: module.issuer,
                    external: getExternalModuleName(module)
                });
            }
        }
    }
    return Array.from(externals);
}
function getExternalModuleName(module) {
    const path = /^external "(.*)"$/.exec(module.identifier)[1];
    const pathComponents = path.split('/');
    const main = pathComponents[0];
    // this is a package within a namespace
    if (main.charAt(0) == '@') {
        return `${main}/${pathComponents[1]}`;
    }
    return main;
}
function isExternalModule(module) {
    return _.startsWith(module.identifier, 'external ') && !isBuiltinModule(getExternalModuleName(module));
}
