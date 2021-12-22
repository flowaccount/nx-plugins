import { normalize, JsonObject } from '@angular-devkit/core';
import { join } from 'path';
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { of } from 'rxjs';
import * as projectGraph from '@nrwl/workspace/src/core/project-graph';
import type { ProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import buildExecutor, { BuildServerlessBuilderOptions } from './build.impl';
import * as normalizeModule from '../../utils/normalize';
import { ServerlessWrapper } from '../../utils/serverless';
import * as serverlessConfig from '../../utils/serverless.config';
import { ExecutorContext } from '@nrwl/devkit';
jest.mock('tsconfig-paths-webpack-plugin');
jest.mock('@nrwl/workspace/src/utilities/run-webpack', () => ({
  runWebpack: jest.fn(),
}));
import { runWebpack } from '@nrwl/workspace/src/utilities/run-webpack';
import { FileReplacement } from '../../utils/types';

describe('Serverless Build Builder', () => {
  let testOptions: BuildServerlessBuilderOptions & JsonObject;

  let context: ExecutorContext;

  beforeEach(async () => {
    jest
      .spyOn(projectGraph, 'createProjectGraph')
      .mockReturnValue({} as ProjectGraph);
    (<any>runWebpack).mockReturnValue(
      of({
        hasErrors: () => false,
        toJson: (stats) => {
          return {};
        },
      })
    );
    spyOn(ServerlessWrapper, 'init').and.returnValue(of(null));
    jest
      .spyOn(serverlessConfig, 'consolidateExcludes')
      .mockImplementation((options) => {
        return options.tsConfig;
      });
    jest.spyOn(ServerlessWrapper, 'serverless', 'get').mockReturnValue({
      cli: {
        log: () => {
          return;
        },
      },
      service: {
        getAllFunctions: () => {
          return [];
        },
      },
    });
    jest
      .spyOn(normalizeModule, 'getEntryForFunction')
      .mockReturnValue({ handler: '/root/apps/serverlessapp/src/handler.ts' });
    (<any>TsConfigPathsPlugin).mockImplementation(
      function MockPathsPlugin() {}
    );

    context = {
      root: '/root',
      cwd: '/root',
      projectName: 'my-app',
      targetName: 'build',
      workspace: {
        version: 2,
        projects: {
          'my-app': <any>{
            root: 'apps/stargaze',
            sourceRoot: 'apps/stargaze',
          },
        },
      },
      isVerbose: false,
    };

    testOptions = {
      tsConfig: 'apps/serverlessapp/tsconfig.app.json',
      outputPath: 'dist/apps/serverlessapp',
      package: 'apps/serverlessapp',
      serverlessConfig: 'apps/serverlessapp/serverless.yml',
      servicePath: 'apps/serverlessapp',
      provider: 'aws',
      processEnvironmentFile: 'env.json',
      externalDependencies: 'all',
      fileReplacements: [
        {
          replace: 'apps/environment/environment.ts',
          with: 'apps/environment/environment.prod.ts',
        },
      ],
      assets: [],
      statsJson: false,
    };
  });
  afterEach(() => jest.clearAllMocks());
  describe('run', () => {
    it('should call runWebpack', async () => {
      await buildExecutor(testOptions, context);
      expect(runWebpack).toHaveBeenCalled();
    });

    it('should emit the outfile along with success', async () => {
      const output = await buildExecutor(testOptions, context);
      expect(output.success).toEqual(true);
      expect(output.outfile).toEqual('/root/dist/apps/serverlessapp');
    });

    it('should handle multiple custom paths in order', async () => {
      jest.mock(
        '/root/config1.js',
        () => (o) => ({ ...o, prop1: 'my-val-1' }),
        { virtual: true }
      );
      jest.mock(
        '/root/config2.js',
        () => (o) => ({
          ...o,
          prop1: o.prop1 + '-my-val-2',
          prop2: 'my-val-2',
        }),
        { virtual: true }
      );
      await buildExecutor(
        { ...testOptions, webpackConfig: ['config1.js', 'config2.js'] },
        context
      );

      expect(runWebpack).toHaveBeenCalled();
    });
  });
});
