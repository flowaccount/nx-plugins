import { join, normalize } from "path";


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
      outputPath: join(normalize('dist'), options.appProjectRoot),
      package: options.appProjectRoot,
      serverlessConfig: join(options.appProjectRoot, 'serverless.yml'),
      servicePath: options.appProjectRoot,
      tsConfig: join(options.appProjectRoot, 'tsconfig.app.json'),
      provider: options.provider,
      processEnvironmentFile: 'env.json'
    },
    configurations: {
      dev: {
        optimization: false,
        sourceMap: false,
        budgets: [
          {
            type: 'initial',
            maximumWarning: '2mb',
            maximumError: '5mb'
          }
        ]
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
            maximumError: '5mb'
          }
        ],
        fileReplacements: [
          {
            replace: join(options.appProjectRoot, 'environment.ts'),
            with: join(options.appProjectRoot, 'environment.prod.ts')
          }
        ]
      }
    }
  };
}
