import { BuilderContext, BuilderOutput } from '@angular-devkit/architect';
import { copy } from 'fs-extra';
import { BuildBuilderOptions, ServerlessBaseOptions } from './types';

export default function copyAssetFiles(
  options: BuildBuilderOptions,
  context: BuilderContext
): Promise<BuilderOutput> {
  context.logger.info('Copying asset files...');
  return Promise.all(
    options.assetFiles.map(file => copy(file.input, file.output))
  )
    .then(() => {
      context.logger.info('Done copying asset files.');
      return {
        success: true
      };
    })
    .catch((err: Error) => {
      return {
        error: err.message,
        success: false
      };
    });
}
