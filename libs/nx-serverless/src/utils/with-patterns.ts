import { AsyncNxComposableWebpackPlugin, NxWebpackExecutionContext } from '@nx/webpack';
import { glob } from 'glob';
import { join, parse, relative } from 'path';
import { type Configuration } from 'webpack';

// @example withPatterns(['./src/handlers/**/handler.ts'])
export function withPatterns(patterns: string[]): AsyncNxComposableWebpackPlugin {
  return async (config: Configuration, { context }: NxWebpackExecutionContext) => {
    const projectRootGlobal = join(
      context.root,
      context.projectsConfigurations!.projects[context.projectName!].root,
    );
    const files = await glob(patterns.map((pattern) => join(projectRootGlobal, pattern)));
    const entry = files.reduce(
      (acc, file) => {
        const relativeFile = relative(projectRootGlobal, file);
        const parsedFile = parse(relativeFile);
        const entryName = join(parsedFile.dir, parsedFile.name);
        acc[entryName] = file;
        return acc;
      },
      {} as Record<string, string>,
    );

    return {
      ...config,
      entry,
    };
  };
}