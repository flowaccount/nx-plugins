"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mergeWebpack = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const config_1 = require("./config");
function getNodePartial(options) {
    const webpackConfig = {
        output: {
            libraryTarget: 'commonjs'
        },
        target: 'node',
        node: false
    };
    if (options.optimization) {
        webpackConfig.optimization = {
            minimize: options.optimization,
            concatenateModules: false
        };
    }
    if (options.externalDependencies === 'all') {
        webpackConfig.externals = [nodeExternals()];
    }
    else if (Array.isArray(options.externalDependencies)) {
        webpackConfig.externals = [
            function (context, request, callback) {
                if (options.externalDependencies.includes(request)) {
                    // not bundled
                    return callback(null, 'commonjs ' + request);
                }
                // bundled
                callback();
            }
        ];
    }
    return webpackConfig;
}
function getNodeWebpackConfig(options) {
    return mergeWebpack(config_1.getBaseWebpackPartial(options), getNodePartial(options));
}
exports.getNodeWebpackConfig = getNodeWebpackConfig;
//# sourceMappingURL=node.config.js.map