import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { Observable } from 'rxjs';
import { ServerlessCompileOptions } from './types';
export declare function compileTypeScriptFiles(options: ServerlessCompileOptions, context: BuilderContext): Observable<BuilderOutput>;
