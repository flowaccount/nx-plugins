import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { ServerlessCompileOptions } from '../../utils/types';
import { compileTypeScriptFiles } from '../../utils/typescript';
import { of, from, Observable, combineLatest } from 'rxjs';
import { switchMap, map, concatMap } from 'rxjs/operators';
import {
  normalizeBuildOptions,
  assignEntriesToFunctionsFromServerless,
  getSourceRoot,
} from '../../utils/normalize';
import { ServerlessWrapper } from '../../utils/serverless';
import { resolve, join } from 'path';
import { convertNxExecutor, ExecutorContext, logger } from '@nrwl/devkit';

export type ServerlesCompiledEvent = {
  outfile: string;
};

export async function compileExecutor(
  options: JsonObject & ServerlessCompileOptions,
  context: ExecutorContext
) {
  const root = getSourceRoot(context);
  options = normalizeBuildOptions(options, context.root, root);
  await ServerlessWrapper.init(options, context);
  options = assignEntriesToFunctionsFromServerless(options, context.root);

  logger.info('start compiling typescript');
  const result = await compileTypeScriptFiles(
    options,
    context
    // libDependencies
  ).toPromise();
  return {
    ...result,
    outfile: resolve(context.root, options.outputPath),
    resolverName: 'DependencyCheckResolver',
    tsconfig: resolve(context.root, options.tsConfig),
  };
}
export default compileExecutor;
