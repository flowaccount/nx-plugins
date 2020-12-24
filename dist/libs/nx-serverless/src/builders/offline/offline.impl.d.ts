import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
export declare const enum InspectType {
    Inspect = "inspect",
    InspectBrk = "inspect-brk"
}
export interface ServerlessExecuteBuilderOptions extends JsonObject {
    inspect: boolean | InspectType;
    waitUntilTargets: string[];
    buildTarget: string;
    watch: boolean;
    args: string[];
    verbose?: boolean;
    binPath?: string;
    host?: string;
    location?: string;
    noAuth?: boolean;
    noEnvironment?: boolean;
    port?: number;
    region?: string;
    printOutput?: boolean;
    preserveTrailingSlash?: boolean;
    stage?: string;
    useSeparateProcesses?: boolean;
    websocketPort?: number;
    prefix?: string;
    hideStackTraces?: boolean;
    corsAllowHeaders?: string;
    corsAllowOrigin?: string;
    corsDisallowCredentials?: string;
    corsExposedHeaders?: string;
    disableCookieValidation?: boolean;
    enforceSecureCookies?: boolean;
    exec?: string;
    readyWhen: string;
}
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ServerlessExecuteBuilderOptions & JsonObject>;
export default _default;
export declare function serverlessExecutionHandler(options: JsonObject & ServerlessExecuteBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
