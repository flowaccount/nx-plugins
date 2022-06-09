import { Configuration, ProgressPlugin, Stats } from 'webpack'

import * as ts from 'typescript'

import { LicenseWebpackPlugin } from 'license-webpack-plugin'
import CircularDependencyPlugin = require('circular-dependency-plugin')
import ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin'
// const CopyPlugin = require('copy-webpack-plugin')
import * as copyPlugin from 'copy-webpack-plugin'
import { readTsConfig } from '@nrwl/workspace'
import { BuildBuilderOptions } from './types'

export const OUT_FILENAME = '[name].js'
export const OUT_CHUNK_FILENAME = '[name]-[id].js'

function getAliases(options: BuildBuilderOptions): { [key: string]: string } {
  return options.fileReplacements.reduce(
    (aliases, replacement) => ({
      ...aliases,
      [replacement.replace]: replacement.with,
    }),
    {}
  )
}

function getStatsConfig(options: BuildBuilderOptions) {
  return {
    hash: true,
    timings: false,
    cached: false,
    cachedAssets: false,
    chunks: true, // Required to get external modules
    chunkModules: true, // Required to get external modules
    modules: true,
    warnings: true,
    errors: true,
    colors: !options.verbose && !options.statsJson,
    assets: !!options.verbose,
    chunkOrigins: !!options.verbose,
    children: !!options.verbose,
    reasons: !!options.verbose,
    version: !!options.verbose,
    errorDetails: !!options.verbose,
    moduleTrace: !!options.verbose,
    usedExports: !!options.verbose,
  }
}

export function getBaseWebpackPartial(
  options: BuildBuilderOptions
): Configuration {
  const { options: compilerOptions } = readTsConfig(options.tsConfig)
  const supportsEs2015 =
    compilerOptions.target !== ts.ScriptTarget.ES3 &&
    compilerOptions.target !== ts.ScriptTarget.ES5
  const mainFields = [...(supportsEs2015 ? ['es2015'] : []), 'module', 'main']
  const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx']
  const webpackConfig: Configuration = {
    entry: options.entry,
    profile: true,
    // devtool: options.sourceMap ? 'source-map' : false,
    mode: options.optimization ? 'production' : 'development',
    output: {
      path: options.outputPath,
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
            experimentalWatchApi: true,
          },
        },
      ],
    },
    resolve: {
      extensions,
      alias: getAliases(options),
      plugins: [
        new TsConfigPathsPlugin({
          configFile: options.tsConfig,
          extensions,
          mainFields,
        }),
      ],
      mainFields,
    },
    performance: {
      hints: false,
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        tsconfig: options.tsConfig,
        workers: options.maxWorkers || ForkTsCheckerWebpackPlugin.TWO_CPUS_FREE,
        useTypescriptIncrementalApi: false,
      }),
    ],
    watch: options.watch,
    watchOptions: {
      poll: options.poll,
    },
    stats: getStatsConfig(options),
  }

  const extraPlugins: any[] = []

  if (options.progress) {
    extraPlugins.push(new ProgressPlugin())
  }

  if (options.extractLicenses) {
    extraPlugins.push(
      new LicenseWebpackPlugin({
        stats: {
          errors: false,
        },
        perChunkOutput: false,
        outputFilename: '3rdpartylicenses.txt',
      })
    )
  }

  // TODO: Re check if option assets exist
  // process asset entries
  if (options.assets && options.assets.length) {

    const copyWebpackPluginPatterns = options.assets.map((asset: any) => {
      return {
        context: asset.input,
        to: asset.output,
        from: asset.glob,
        ignore: asset.ignore,
        // from: {
        //   glob: asset.glob,
        //   dot: true,
        // }
      }
    })
  const copyOptions = {
    patterns: copyWebpackPluginPatterns,
    // options: {ignore: ['.gitkeep', '**/.DS_Store', '**/Thumbs.db'],}
    // Now we remove starting slash to make Webpack place it from the output root.
  }

  const copyWebpackPluginInstance = new copyPlugin(
    copyOptions
  );
  extraPlugins.push(copyWebpackPluginInstance);
}

  if (options.showCircularDependencies) {
    extraPlugins.push(
      new CircularDependencyPlugin({
        exclude: /[\\\/]node_modules[\\\/]/,
      })
    )
  }

  webpackConfig.plugins = [...webpackConfig.plugins, ...extraPlugins]

  return webpackConfig
}
