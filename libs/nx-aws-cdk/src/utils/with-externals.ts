import { NxComposableWebpackPlugin } from '@nx/webpack';
import type { Configuration } from 'webpack';

// @example withExternals([/^@aws-sdk\//, /^@aws-lambda-powertools\//])
export function withExternals(externals: RegExp[]): NxComposableWebpackPlugin {
  return function configure(config: Configuration): Configuration {
    config.externals = Array.isArray(config.externals)
      ? config.externals
      : config.externals
        ? [config.externals]
        : [];
    config.externals.push(function (
      ctx,
      callback: (
        err?: null | Error,
        result?: string | boolean | string[] | { [index: string]: any },
      ) => void,
    ) {
      if (externals.some((e) => e.test(ctx.request))) {
        // not bundled
        return callback(null, `commonjs ${ctx.request}`);
      }
      // bundled
      callback();
    });

    return config;
  };
}