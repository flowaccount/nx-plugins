import { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import * as nodeExternals from 'webpack-node-externals';

import { getBaseWebpackPartial } from './config';
import { BuildBuilderOptions } from './types';

function getNodePartial(options: BuildBuilderOptions) {
  const webpackConfig: Configuration = {
    output: {
      libraryTarget: 'commonjs',
    },
    target: 'node',
    node: false,
  };

  if (options.optimization) {
    webpackConfig.optimization = {
      minimize: options.optimization,
      concatenateModules: false,
    };
  }
  if (options.externalDependencies === 'all') {
    webpackConfig.externals = [nodeExternals()];
  } else if (Array.isArray(options.externalDependencies)) {
    webpackConfig.externals = [
      (data,
				callback) =>
      {
        // function (context, request, callback: Function) {
          if (options.externalDependencies.includes(data.request)) {
            // not bundled
            return callback(null, `commonjs ${data.request}`);
          }
          // bundled
          callback();
      },
    ];
  }

  return webpackConfig;
}

export function getNodeWebpackConfig(options: BuildBuilderOptions) {
  return merge(getBaseWebpackPartial(options), getNodePartial(options));
}
