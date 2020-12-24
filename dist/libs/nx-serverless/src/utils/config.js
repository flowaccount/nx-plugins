"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_1 = require("webpack");
const ts = require("typescript");
const license_webpack_plugin_1 = require("license-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const tsconfig_paths_webpack_plugin_1 = require("tsconfig-paths-webpack-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const workspace_1 = require("@nrwl/workspace");
exports.OUT_FILENAME = '[name].js';
exports.OUT_CHUNK_FILENAME = '[name]-[id].js';
function getAliases(options) {
    return options.fileReplacements.reduce((aliases, replacement) => (Object.assign(Object.assign({}, aliases), { [replacement.replace]: replacement.with })), {});
}
function getStatsConfig(options) {
    return {
        hash: true,
        timings: false,
        cached: false,
        cachedAssets: false,
        modules: true,
        warnings: true,
        errors: true,
        colors: !options.verbose && !options.statsJson,
        chunks: !options.verbose,
        assets: !!options.verbose,
        chunkOrigins: !!options.verbose,
        chunkModules: !!options.verbose,
        children: !!options.verbose,
        reasons: !!options.verbose,
        version: !!options.verbose,
        errorDetails: !!options.verbose,
        moduleTrace: !!options.verbose,
        usedExports: !!options.verbose
    };
}
function getBaseWebpackPartial(options) {
    const { options: compilerOptions } = workspace_1.readTsConfig(options.tsConfig);
    const supportsEs2015 = compilerOptions.target !== ts.ScriptTarget.ES3 &&
        compilerOptions.target !== ts.ScriptTarget.ES5;
    const mainFields = [...(supportsEs2015 ? ['es2015'] : []), 'module', 'main'];
    const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];
    const webpackConfig = {
        entry: options.entry,
        profile: true,
        // devtool: options.sourceMap ? 'source-map' : false,
        mode: options.optimization ? 'production' : 'development',
        output: {
            path: options.outputPath
            // filename: OUT_FILENAME,
            // chunkFilename: OUT_CHUNK_FILENAME
        },
        module: {
            rules: [
                {
                    test: /\.(j|t)sx?$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: options.tsConfig,
                        transpileOnly: true,
                        // https://github.com/TypeStrong/ts-loader/pull/685
                        experimentalWatchApi: true
                    }
                }
            ]
        },
        resolve: {
            extensions,
            alias: getAliases(options),
            plugins: [
                new tsconfig_paths_webpack_plugin_1.default({
                    configFile: options.tsConfig,
                    extensions,
                    mainFields
                })
            ],
            mainFields
        },
        performance: {
            hints: false
        },
        plugins: [
            new ForkTsCheckerWebpackPlugin({
                tsconfig: options.tsConfig,
                workers: options.maxWorkers || ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE,
                useTypescriptIncrementalApi: false
            })
        ],
        watch: options.watch,
        watchOptions: {
            poll: options.poll
        },
        stats: getStatsConfig(options)
    };
    const extraPlugins = [];
    if (options.progress) {
        extraPlugins.push(new webpack_1.ProgressPlugin());
    }
    if (options.extractLicenses) {
        extraPlugins.push(new license_webpack_plugin_1.LicenseWebpackPlugin({
            stats: {
                errors: false
            },
            perChunkOutput: false,
            outputFilename: '3rdpartylicenses.txt'
        }));
    }
    // process asset entries
    if (options.assets) {
        const copyWebpackPluginPatterns = options.assets.map((asset) => {
            return {
                context: asset.input,
                // Now we remove starting slash to make Webpack place it from the output root.
                to: asset.output,
                ignore: asset.ignore,
                from: {
                    glob: asset.glob,
                    dot: true
                }
            };
        });
        const copyWebpackPluginOptions = {
            ignore: ['.gitkeep', '**/.DS_Store', '**/Thumbs.db']
        };
        const copyWebpackPluginInstance = new CopyWebpackPlugin(copyWebpackPluginPatterns, copyWebpackPluginOptions);
        extraPlugins.push(copyWebpackPluginInstance);
    }
    if (options.showCircularDependencies) {
        extraPlugins.push(new CircularDependencyPlugin({
            exclude: /[\\\/]node_modules[\\\/]/
        }));
    }
    webpackConfig.plugins = [...webpackConfig.plugins, ...extraPlugins];
    return webpackConfig;
}
exports.getBaseWebpackPartial = getBaseWebpackPartial;
//# sourceMappingURL=config.js.map