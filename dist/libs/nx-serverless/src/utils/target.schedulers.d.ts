import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
export declare function runWaitUntilTargets(waitUntilTargets: string[], context: BuilderContext): Observable<BuilderOutput>;
export declare function startBuild(options: {
    buildTarget: string;
} & JsonObject, context: BuilderContext): Observable<BuilderOutput>;
