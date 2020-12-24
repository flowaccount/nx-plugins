"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@angular-devkit/core");
const node_1 = require("@angular-devkit/core/node");
const path_1 = require("path");
const fs_1 = require("fs");
const glob = require("glob");
const path_2 = require("path");
const _ = require("lodash");
const serverless_1 = require("./serverless");
function assignEntriesToFunctionsFromServerless(options, root) {
    serverless_1.ServerlessWrapper.serverless.cli.log('getting all functions');
    const functions = serverless_1.ServerlessWrapper.serverless.service.getAllFunctions();
    const entries = {};
    _.forEach(functions, (func, index) => {
        core_1.normalize;
        const entry = exports.getEntryForFunction(functions[index], serverless_1.ServerlessWrapper.serverless.service.getFunction(func), serverless_1.ServerlessWrapper.serverless, options.sourceRoot, root);
        _.merge(entries, entry);
    });
    const result = Object.assign(Object.assign({}, options), { files: entries });
    return result;
}
exports.assignEntriesToFunctionsFromServerless = assignEntriesToFunctionsFromServerless;
function getProjectRoot(context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const workspaceHost = core_1.workspaces.createWorkspaceHost(new node_1.NodeJsSyncHost());
        const { workspace } = yield core_1.workspaces.readWorkspace(context.workspaceRoot, workspaceHost);
        if (workspace.projects.get(context.target.project).root) {
            return workspace.projects.get(context.target.project).root;
        }
        else {
            context.reportStatus('Error');
            const message = `${context.target.project} does not have a root. Please define one.`;
            context.logger.error(message);
            throw new Error(message);
        }
    });
}
exports.getProjectRoot = getProjectRoot;
function getSourceRoot(context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
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
exports.getSourceRoot = getSourceRoot;
function normalizeBuildOptions(options, root, sourceRoot) {
    const result = Object.assign(Object.assign({}, options), { root: root, sourceRoot: sourceRoot, package: path_1.resolve(root, options.package), serverlessConfig: path_1.resolve(root, options.serverlessConfig), servicePath: path_1.resolve(root, options.servicePath), outputPath: path_1.resolve(root, options.outputPath), tsConfig: path_1.resolve(root, options.tsConfig), fileReplacements: normalizeFileReplacements(root, options.fileReplacements), assets: normalizeAssets(options.assets, root, sourceRoot), webpackConfig: options.webpackConfig
            ? path_1.resolve(root, options.webpackConfig)
            : options.webpackConfig });
    return result;
}
exports.normalizeBuildOptions = normalizeBuildOptions;
const preferredExtensions = ['.js', '.ts', '.jsx', '.tsx'];
exports.getEntryForFunction = (name, serverlessFunction, serverless, sourceroot, root) => {
    const handler = serverlessFunction.handler;
    const handlerFile = getHandlerFile(handler);
    if (!handlerFile) {
        _.get(serverless, 'service.provider.name') !== 'google' &&
            serverless.cli.log(`\nWARNING: Entry for ${name}@${handler} could not be retrieved.\nPlease check your service config if you want to use lib.entries.`);
        return {};
    }
    const ext = getEntryExtension(handlerFile, serverless);
    // Create a valid entry key
    let handlerFileFinal = `${sourceroot.replace('/src', '')}/${handlerFile}${ext}`;
    if (handlerFile.match(/src/)) {
        handlerFileFinal = `${sourceroot}/${handlerFile.replace('src/', '')}${ext}`;
    }
    return {
        [handlerFile]: path_1.resolve(root, `${handlerFileFinal}`)
    };
};
const getHandlerFile = handler => {
    // Check if handler is a well-formed path based handler.
    const handlerEntry = /(.*)\..*?$/.exec(handler);
    if (handlerEntry) {
        return handlerEntry[1];
    }
};
const getEntryExtension = (fileName, serverless) => {
    const files = glob.sync(`${fileName}.*`, {
        cwd: serverless.config.servicePath,
        nodir: true
        // ignore: this.configuration.excludeFiles ? this.configuration.excludeFiles : undefined
    });
    if (_.isEmpty(files)) {
        // If we cannot find any handler we should terminate with an error
        throw new serverless.classes.Error(`No matching handler found for '${fileName}' in '${serverless.config.servicePath}'. Check your service definition.`);
    }
    // Move preferred file extensions to the beginning
    const sortedFiles = _.uniq(_.concat(_.sortBy(_.filter(files, file => _.includes(preferredExtensions, path_2.extname(file))), a => _.size(a)), files));
    if (_.size(sortedFiles) > 1) {
        serverless.cli.log(`WARNING: More than one matching handlers found for '${fileName}'. Using '${_.first(sortedFiles)}'.`);
    }
    return path_2.extname(_.first(sortedFiles));
};
function normalizeAssets(assets, root, sourceRoot) {
    return assets.map(asset => {
        if (typeof asset === 'string') {
            const assetPath = core_1.normalize(asset);
            const resolvedAssetPath = path_1.resolve(root, assetPath);
            const resolvedSourceRoot = path_1.resolve(root, sourceRoot);
            if (!resolvedAssetPath.startsWith(resolvedSourceRoot)) {
                throw new Error(`The ${resolvedAssetPath} asset path must start with the project source root: ${sourceRoot}`);
            }
            const isDirectory = fs_1.statSync(resolvedAssetPath).isDirectory();
            const input = isDirectory
                ? resolvedAssetPath
                : path_1.dirname(resolvedAssetPath);
            const output = path_1.relative(resolvedSourceRoot, path_1.resolve(root, input));
            const glob = isDirectory ? '**/*' : path_1.basename(resolvedAssetPath);
            return {
                input,
                output,
                glob
            };
        }
        else {
            if (asset.output.startsWith('..')) {
                throw new Error('An asset cannot be written to a location outside of the output path.');
            }
            const assetPath = core_1.normalize(asset.input);
            const resolvedAssetPath = path_1.resolve(root, assetPath);
            return Object.assign(Object.assign({}, asset), { input: resolvedAssetPath, 
                // Now we remove starting slash to make Webpack place it from the output root.
                output: asset.output.replace(/^\//, '') });
        }
    });
}
function normalizeFileReplacements(root, fileReplacements) {
    return fileReplacements.map(fileReplacement => ({
        replace: path_1.resolve(root, fileReplacement.replace),
        with: path_1.resolve(root, fileReplacement.with)
    }));
}
function getProdModules(externalModules, packageJson, packagePath, forceExcludes, dependencyGraph, verbose = false) {
    const prodModules = [];
    // only process the module stated in dependencies section
    if (!packageJson.dependencies) {
        return [];
    }
    const ignoredDevDependencies = [
        'aws-sdk',
        '@types/aws-serverless-express',
        '@types/aws-lambda',
        '@types/node'
    ];
    // Get versions of all transient modules
    _.forEach(externalModules, module => {
        let moduleVersion = packageJson.dependencies[module.external];
        if (moduleVersion) {
            prodModules.push(`${module.external}@${moduleVersion}`);
            // Check if the module has any peer dependencies and include them too
            try {
                const modulePackagePath = path_2.join(path_1.dirname(packagePath), 'node_modules', module.external, 'package.json');
                const peerDependencies = require(modulePackagePath).peerDependencies;
                if (!_.isEmpty(peerDependencies)) {
                    verbose &&
                        serverless_1.ServerlessWrapper.serverless.cli.log(`Adding explicit peers for dependency ${module.external}`);
                    const peerModules = this.getProdModules.call(this, _.map(peerDependencies, (value, key) => ({ external: key })), packageJson, packagePath, forceExcludes, dependencyGraph);
                    Array.prototype.push.apply(prodModules, peerModules);
                }
            }
            catch (e) {
                serverless_1.ServerlessWrapper.serverless.cli.log(`WARNING: Could not check for peer dependencies of ${module.external}`);
            }
        }
        if (!packageJson.devDependencies ||
            (!packageJson.devDependencies[module.external] &&
                dependencyGraph.dependencies)) {
            if (_.includes(ignoredDevDependencies, module.external)) {
                serverless_1.ServerlessWrapper.serverless.cli.log(`INFO: Skipping addition of ${module.external} which is supposed to be devDependencies`);
            }
            else {
                // Add transient dependencies if they appear not in the service's dev dependencies
                const originInfo = _.get(dependencyGraph, 'dependencies', {})[module.external] || {};
                moduleVersion = _.get(originInfo, 'version', null);
                if (!moduleVersion) {
                    serverless_1.ServerlessWrapper.serverless.cli.log(`WARNING: Could not determine version of module ${module.external}`);
                }
                prodModules.push(moduleVersion
                    ? `${module.external}@${moduleVersion}`
                    : module.external);
            }
        }
        else if (packageJson.devDependencies &&
            packageJson.devDependencies[module.external] &&
            !_.includes(forceExcludes, module.external)) {
            // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
            // most likely set in devDependencies and should not lead to an error now.
            if (!_.includes(ignoredDevDependencies, module.external)) {
                // Runtime dependency found in devDependencies but not forcefully excluded
                serverless_1.ServerlessWrapper.serverless.cli.log(`ERROR: Runtime dependency '${module.external}' found in devDependencies. Move it to dependencies or use forceExclude to explicitly exclude it.`);
                throw new serverless_1.ServerlessWrapper.serverless.classes.Error(`Serverless-webpack dependency error: ${module.external}.`);
            }
            verbose &&
                serverless_1.ServerlessWrapper.serverless.cli.log(`INFO: Runtime dependency '${module.external}' found in devDependencies. It has been excluded automatically.`);
        }
    });
    return prodModules;
}
exports.getProdModules = getProdModules;
//# sourceMappingURL=normalize.js.map