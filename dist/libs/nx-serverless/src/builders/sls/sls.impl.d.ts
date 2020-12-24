import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
export declare const enum InspectType {
    Inspect = "inspect",
    InspectBrk = "inspect-brk"
}
export interface ServerlessSlsBuilderOptions extends JsonObject {
    inspect: boolean | InspectType;
    waitUntilTargets: string[];
    buildTarget: string;
    host: string;
    port: number;
    watch: boolean;
    arguments: string[];
    package: string;
    location: string;
    stage: string;
    verbose?: boolean;
    sourceRoot?: string;
    root?: string;
    command: string;
    ignoreScripts: boolean;
}
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ServerlessSlsBuilderOptions & JsonObject>;
export default _default;
export declare function serverlessExecutionHandler(options: JsonObject & ServerlessSlsBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
export declare function getExecArgv(commmandArguments: Array<string>): any[];
