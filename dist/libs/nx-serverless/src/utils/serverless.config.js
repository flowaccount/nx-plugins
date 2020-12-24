"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serverless_1 = require("./serverless");
const _ = require("lodash");
const ts = require("typescript");
const upath = require("upath");
const fileutils_1 = require("@nrwl/workspace/src/utils/fileutils");
const path_1 = require("path");
const ignore_1 = require("ignore");
const defaultExcludes = ['.serverless_plugins/**'];
function consolidateExcludes(options, context) {
    const packageExcludes = serverless_1.ServerlessWrapper.serverless.service.package.exclude || [];
    // add local service plugins Path
    let pluginsLocalPath = serverless_1.ServerlessWrapper.serverless.pluginManager.parsePluginsObject(serverless_1.ServerlessWrapper.serverless.service.plugins).localPath;
    pluginsLocalPath = /^win/.test(process.platform)
        ? upath.toUnix(pluginsLocalPath)
        : pluginsLocalPath;
    const localPathExcludes = pluginsLocalPath.localPath
        ? [pluginsLocalPath.localPath]
        : [];
    // add layer paths
    // const layerExcludes = excludeLayers
    //   ? ServerlessWrapper.serverless.service
    //       .getAllLayers()
    //       .map(layer => `${ServerlessWrapper.serverless.service.getLayer(layer).path}/**`)
    //   : [];
    // add defaults for exclude
    const excludeList = _.union(defaultExcludes, localPathExcludes, packageExcludes
    // layerExcludes,
    // functionExcludes
    );
    // const parsedTSConfig = readTsConfig(options.tsConfig);
    const parsedTSConfig = ts.readConfigFile(options.tsConfig, ts.sys.readFile)
        .config;
    const appRoot = options.sourceRoot.replace('src', '');
    context.logger.info(`Adding excluding list to tsconfig ${excludeList}`);
    if (excludeList.length > 0) {
        /* Handle excludes for handlers */
        context.logger.info('Checking if exclude paths overlaps with handlers...');
        const handlerPaths = Object.values(options.files).map((m) => path_1.relative(appRoot, m));
        const ig = ignore_1.default().add(excludeList);
        const filteredPaths = ig.filter(handlerPaths);
        if (filteredPaths.length < handlerPaths.length) {
            context.logger.warn('There is an overlap!\nPlease make sure you are purposely doing this!\nI will build, taking your handlers defined in serverless.yml as the only "entry points"!');
            context.logger.warn(`handlers ---> ${JSON.stringify(options.files)}`);
        }
        Object.keys(options.files).forEach(handlerEntryName => {
            if (filteredPaths.indexOf(path_1.relative(appRoot, options.files[handlerEntryName])) === -1) {
                delete options.files[handlerEntryName];
            }
        });
        context.logger.warn(`you are left with --> ${JSON.stringify(options.files)}`);
        if (Object.keys(options.files).length === 0) {
            throw `Please check your exclude paths --> ${JSON.stringify(excludeList)}\nThere needs to be at least one handler to be compiled!`;
        }
        /* Handle excludes for handlers */
        // check for overlapping of files being excluded here ...
        if (!parsedTSConfig.exclude) {
            parsedTSConfig.exclude = [];
        }
        parsedTSConfig.exclude = parsedTSConfig.exclude.concat(excludeList);
    } //  context.workspaceRoot,
    const tmpTsConfigPath = path_1.join(appRoot, 'tsconfig.serverless.nx-tmp');
    context.logger.info(`writing tsconfig.serverless.nx-tmp with added excludeLists to ${tmpTsConfigPath}`);
    fileutils_1.writeJsonFile(tmpTsConfigPath, parsedTSConfig);
    return tmpTsConfigPath;
}
exports.consolidateExcludes = consolidateExcludes;
//# sourceMappingURL=serverless.config.js.map