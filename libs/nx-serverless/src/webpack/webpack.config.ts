//import * as nodeExternals  from 'webpack-node-externals';
import { composePlugins, withNx, NxComposableWebpackPlugin, NxWebpackExecutionContext } from '@nx/webpack'
import { withExternals } from '../utils/with-externals';
import type { Configuration } from 'webpack';


export function withNode(): NxComposableWebpackPlugin {
    return function configure(config: Configuration,  { options, context }: NxWebpackExecutionContext): Configuration {
      config.node = {
        __dirname: true
      };
      config.target = 'node';
      config.output = { globalObject: 'this'}
      return config;
    };
  }

module.exports = composePlugins(
    withNx(),
    withExternals([/^@aws-sdk\//]),
    //withNode(),
);


