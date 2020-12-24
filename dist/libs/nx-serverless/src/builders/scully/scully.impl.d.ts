import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable } from 'rxjs';
export interface ScullyBuilderOptions extends JsonObject {
    buildTarget: string;
    skipBuild: boolean;
    configFiles: string[];
    showGuessError?: boolean;
    showBrowser?: boolean;
    removeStaticDist?: boolean;
    baseFilter?: string;
    proxy?: string;
    open?: boolean;
    scanRoutes?: boolean;
    highlight?: boolean;
}
declare const _default: import("@angular-devkit/architect/src/internal").Builder<ScullyBuilderOptions & JsonObject>;
export default _default;
export declare function scullyCmdRunner(options: JsonObject & ScullyBuilderOptions, context: BuilderContext): Observable<BuilderOutput>;
