import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { ServerlessOfflineOptions } from '../../utils/types';
export declare const enum InspectType {
    Inspect = "inspect",
    InspectBrk = "inspect-brk"
}
export interface ServerlessDeployBuilderOptions extends ServerlessOfflineOptions {
    inspect: boolean | InspectType;
    waitUntilTargets: string[];
    buildTarget: string;
    host: string;
    port: number;
    watch: boolean;
    args: string[];
}
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ServerlessDeployBuilderOptions & JsonObject>;
export default _default;
export declare function serverlessExecutionHandler(options: JsonObject & ServerlessDeployBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
