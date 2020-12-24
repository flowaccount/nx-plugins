import { Configuration, BannerPlugin } from 'webpack';
const mergeWebpack = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

import { getBaseWebpackPartial } from './config';
import { BuildBuilderOptions } from './types';

function getNodePartial(options: BuildBuilderOptions) {
  const webpackConfig: Configuration = {
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
  } else if (Array.isArray(options.externalDependencies)) {
    webpackConfig.externals = [
      function(context, request, callback: Function) {
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

export function getNodeWebpackConfig(options: BuildBuilderOptions) {
  return mergeWebpack(getBaseWebpackPartial(options), getNodePartial(options));
}
