import { ExecutorContext } from '@nx/devkit';
import * as glob from 'glob';
import { basename, join } from 'path';
import { BuildBuilderOptions, FileInputOutput } from './types';

export default function normalizeAssetOptions(
  options: BuildBuilderOptions,
  context: ExecutorContext
): BuildBuilderOptions {
  const outDir = options.outputPath;
  const files: FileInputOutput[] = [];
  const globbedFiles = (pattern: string, input = '', ignore: string[] = []) => {
    return glob.sync(pattern, {
      cwd: input,
      nodir: true,
      ignore,
    });
  };
  options.assets.forEach((asset) => {
    if (typeof asset === 'string') {
      globbedFiles(asset, context.root).forEach((globbedFile) => {
        files.push({
          input: join(context.root, globbedFile),
          output: join(context.root, outDir, basename(globbedFile)),
        });
      });
    } else {
      globbedFiles(
        asset.glob,
        join(context.root, asset.input),
        asset.ignore
      ).forEach((globbedFile) => {
        files.push({
          input: join(context.root, asset.input, globbedFile),
          output: join(context.root, outDir, asset.output, globbedFile),
        });
      });
    }
  });
  return {
    ...options,
    assetFiles: files,
  };
}
