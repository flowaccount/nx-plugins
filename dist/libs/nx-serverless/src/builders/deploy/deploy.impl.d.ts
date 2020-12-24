import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
export declare const enum InspectType {
    Inspect = "inspect",
    InspectBrk = "inspect-brk"
}
export interface ServerlessDeployBuilderOptions extends JsonObject {
    inspect: boolean | InspectType;
    waitUntilTargets: string[];
    buildTarget: string;
    function: string;
    host: string;
    port: number;
    watch: boolean;
    args: string[];
    package: string;
    location: string;
    stage: string;
    list: boolean;
    updateConfig: boolean;
    verbose?: boolean;
    sourceRoot?: string;
    root?: string;
    ignoreScripts: boolean;
}
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ServerlessDeployBuilderOptions & JsonObject>;
export default _default;
export declare function serverlessExecutionHandler(options: JsonObject & ServerlessDeployBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
export declare function getExecArgv(options: ServerlessDeployBuilderOptions): any[];
