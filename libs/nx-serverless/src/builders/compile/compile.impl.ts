import {
  BuilderContext,
  createBuilder,
  BuilderOutput
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { ServerlessCompileOptions } from '../../utils/types';
import { compileTypeScriptFiles } from '../../utils/typescript';
import { of, from, Observable, combineLatest } from 'rxjs';
import { switchMap, map, concatMap } from 'rxjs/operators';
import {
  normalizeBuildOptions,
  assignEntriesToFunctionsFromServerless,
  getSourceRoot
} from '../../utils/normalize';
import { ServerlessWrapper } from '../../utils/serverless';
import { resolve, join } from 'path';

export type ServerlesCompiledEvent = {
  outfile: string;
};

export default createBuilder(run);

export function run(
  options: JsonObject & ServerlessCompileOptions,
  context: BuilderContext
): Observable<ServerlesCompiledEvent> {
  return from(getSourceRoot(context)).pipe(
    map(sourceRoot =>
      normalizeBuildOptions(
        options,
        context.workspaceRoot,
        join(context.workspaceRoot, sourceRoot)
      )
    ),
    switchMap(options =>
      combineLatest(of(options), from(ServerlessWrapper.init(options, context)))
    ),
    map(([options]) => {
      return assignEntriesToFunctionsFromServerless(
        options,
        context.workspaceRoot
      );
    }),
    concatMap(options => {
      context.logger.info('start compiling typescript');
      return compileTypeScriptFiles(
        options,
        context
        // libDependencies
      );
    }),
    map((value: BuilderOutput) => {
      return {
        ...value,
        outfile: resolve(context.workspaceRoot, options.outputPath),
        resolverName: 'DependencyCheckResolver',
        tsconfig: resolve(context.workspaceRoot, options.tsConfig)
      };
    })
  );
}
