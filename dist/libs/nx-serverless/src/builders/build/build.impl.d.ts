import { JsonObject } from '@angular-devkit/core';
import { BuildResult } from '@angular-devkit/build-webpack';
import { BuildBuilderOptions, ServerlessEventResult } from '../../utils/types';
export interface BuildServerlessBuilderOptions extends BuildBuilderOptions {
}
export declare type ServerlessBuildEvent = BuildResult & ServerlessEventResult & {
    outfile: string;
};
declare const _default: import("@angular-devkit/architect/src/internal").Builder<JsonObject & BuildServerlessBuilderOptions>;
export default _default;
