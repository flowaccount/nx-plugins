import { BuilderContext } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { ServerlessCompileOptions } from '../../utils/types';
import { Observable } from 'rxjs';
export declare type ServerlesCompiledEvent = {
    outfile: string;
};
declare const _default: import("@angular-devkit/architect/src/internal").Builder<JsonObject & ServerlessCompileOptions>;
export default _default;
export declare function run(options: JsonObject & ServerlessCompileOptions, context: BuilderContext): Observable<ServerlesCompiledEvent>;
