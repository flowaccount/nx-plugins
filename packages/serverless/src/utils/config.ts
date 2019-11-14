// import { Configuration } from 'webpack';
// import webpackMerge from 'webpack-merge';
// import { ServerlessBuildBuilderOptions } from '../builders/build/build.impl';

// /**
//  * This entry-point is called by nrwl's builder, just before it calls out to webpack.
//  * It allows us to customise the webpack build, while building on top of everything that
//  * the nrwl building is already doing.
//  *
//  * We trigger this by setting options.webpackConfig to the path of this file in the builder.
//  *
//  */
// export = (
//     configFromNrwlNodeBuilder: Configuration,
//     options: {
//         options: ServerlessBuildBuilderOptions;
//         configuration: string;
//     }
// ) => {
//     const config = webpackMerge(configFromNrwlNodeBuilder, getCustomWebpack());
//     // override the entry with the entry determined in the builder
//     //config.entry = options.options.entry;
//     // if the end-consumer provided their own function to customise the webpack config, run it
//     const webpackConfig = options.options.webpackConfig;
//     if (webpackConfig) {
//         const configFn = require(webpackConfig);
//         return configFn(config, options);
//     }
//     return config;
// };

// function getCustomWebpack(): Configuration {
//     return {
//         output: {
//             libraryTarget: 'commonjs',
//             // we create each chunk in it's own directory: this makes it easy to upload independent packages
//             filename: '[name].js'
//         },
//         externals: [
            
//         ],
//         optimization: {
//             minimize: false
//         }
//     };
// }
