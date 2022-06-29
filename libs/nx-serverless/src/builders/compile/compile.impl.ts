import { ServerlessCompileOptions } from '../../utils/types';
import { compileTypeScriptFiles } from '../../utils/typescript';
import {
  normalizeBuildOptions,
  assignEntriesToFunctionsFromServerless,
  getSourceRoot,
} from '../../utils/normalize';
import { ServerlessWrapper } from '../../utils/serverless';
import { resolve } from 'path';
import { ExecutorContext, logger } from '@nrwl/devkit';

export type ServerlesCompiledEvent = {
  outfile: string;
};

export async function compileExecutor(
  options: ServerlessCompileOptions,
  context: ExecutorContext
) {
  logger.info(`executing typescript compilation with tsConfig:${resolve(context.root, options.tsConfig)}`);
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
  const toReturn = {
    ...result,
    outfile: resolve(context.root, options.outputPath),
    resolverName: 'DependencyCheckResolver',
    tsconfig: resolve(context.root, options.tsConfig),
  };
  logger.info(toReturn)
  return toReturn;
}
export default compileExecutor;
