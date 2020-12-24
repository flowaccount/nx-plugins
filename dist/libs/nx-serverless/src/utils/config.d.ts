import { Configuration } from 'webpack';
import { BuildBuilderOptions } from './types';
export declare const OUT_FILENAME = "[name].js";
export declare const OUT_CHUNK_FILENAME = "[name]-[id].js";
export declare function getBaseWebpackPartial(options: BuildBuilderOptions): Configuration;
