import { joinPathFragments } from '@nrwl/devkit';
import { normalize } from 'path';

export interface BaseSchema {
  appProjectRoot: string;
  provider: string;
  region: string;
  endpointType: string;
  skipFormat: boolean;
}

export function getBuildConfig(options: BaseSchema) {
  return {
    executor: '@flowaccount/nx-serverless:build',
    options: {
      outputPath: joinPathFragments(normalize('dist'), options.appProjectRoot),
      package: options.appProjectRoot,
      serverlessConfig: joinPathFragments(
        options.appProjectRoot,
        'serverless.ts'
      ),
      servicePath: options.appProjectRoot,
      tsConfig: joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
      provider: options.provider,
      processEnvironmentFile: 'env.json',
    },
    configurations: {
      dev: {
        optimization: false,
        sourceMap: false,
        budgets: [
          {
            type: 'initial',
            maximumWarning: '2mb',
            maximumError: '5mb',
          },
        ],
      },
      production: {
        optimization: true,
        sourceMap: false,
        extractCss: true,
        namedChunks: false,
        extractLicenses: true,
        vendorChunk: false,
        budgets: [
          {
            type: 'initial',
            maximumWarning: '2mb',
            maximumError: '5mb',
          },
        ],
        fileReplacements: [
          {
            replace: joinPathFragments(
              options.appProjectRoot,
              'environment.ts'
            ),
            with: joinPathFragments(
              options.appProjectRoot,
              'environment.prod.ts'
            ),
          },
        ],
      },
    },
  };
}
