import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { ServerlessDeployBuilderOptions } from '../deploy/deploy.impl';
export declare type ServerlesCompiledEvent = {
    outfile: string;
};
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ServerlessDeployBuilderOptions & JsonObject>;
export default _default;
export declare function serverlessExecutionHandler(options: JsonObject & ServerlessDeployBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
export declare function getExecArgv(options: ServerlessDeployBuilderOptions): Array<string>;
