import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { ServerlessOfflineOptions } from '../../utils/types';
export interface ServerlessBuildBuilderOptions extends ServerlessOfflineOptions {
}
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ServerlessBuildBuilderOptions & JsonObject>;
export default _default;
export declare function run(options: JsonObject & ServerlessBuildBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
