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
const core_1 = require("@angular-devkit/core");
const path_1 = require("path");
const fs_1 = require("fs");
const glob = require("glob");
const path = require("path");
const _ = require("lodash");
const serverless_1 = require("./serverless");
function normalizeBuildOptions(options, root, sourceRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        serverless_1.ServerlessWrapper.serverless.cli.log("getting all functions");
        const functions = serverless_1.ServerlessWrapper.serverless.service.getAllFunctions();
        const entries = {};
        _.forEach(functions, (func, index) => {
            const entry = getEntryForFunction(functions[index], serverless_1.ServerlessWrapper.serverless.service.getFunction(func), serverless_1.ServerlessWrapper.serverless, sourceRoot, root);
            _.merge(entries, entry);
        });
        const result = Object.assign({}, options, { root: root, sourceRoot: sourceRoot, entry: entries, outputPath: path_1.resolve(root, options.outputPath), tsConfig: path_1.resolve(root, options.tsConfig), fileReplacements: normalizeFileReplacements(root, options.fileReplacements), assets: normalizeAssets(options.assets, root, sourceRoot), webpackConfig: options.webpackConfig
                ? path_1.resolve(root, options.webpackConfig)
                : options.webpackConfig });
        return result;
    });
}
exports.normalizeBuildOptions = normalizeBuildOptions;
const preferredExtensions = [
    '.js',
    '.ts',
    '.jsx',
    '.tsx'
];
const getEntryForFunction = (name, serverlessFunction, serverless, sourceroot, root) => {
    const handler = serverlessFunction.handler;
    const handlerFile = getHandlerFile(handler);
    if (!handlerFile) {
        _.get(this.serverless, 'service.provider.name') !== 'google' &&
            serverless.cli.log(`\nWARNING: Entry for ${name}@${handler} could not be retrieved.\nPlease check your service config if you want to use lib.entries.`);
        return {};
    }
    const ext = getEntryExtension(handlerFile, serverless);
    // Create a valid entry key
    const handlerFileFinal = handlerFile.replace('\src', '');
    return {
        [handlerFile]: path_1.resolve(root, `${sourceroot}${handlerFileFinal}${ext}`)
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
        nodir: true,
    });
    if (_.isEmpty(files)) {
        // If we cannot find any handler we should terminate with an error
        throw new this.serverless.classes.Error(`No matching handler found for '${fileName}' in '${serverless.config.servicePath}'. Check your service definition.`);
    }
    // Move preferred file extensions to the beginning
    const sortedFiles = _.uniq(_.concat(_.sortBy(_.filter(files, file => _.includes(preferredExtensions, path.extname(file))), a => _.size(a)), files));
    if (_.size(sortedFiles) > 1) {
        this.serverless.cli.log(`WARNING: More than one matching handlers found for '${fileName}'. Using '${_.first(sortedFiles)}'.`);
    }
    return path.extname(_.first(sortedFiles));
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
            return Object.assign({}, asset, { input: resolvedAssetPath, 
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
