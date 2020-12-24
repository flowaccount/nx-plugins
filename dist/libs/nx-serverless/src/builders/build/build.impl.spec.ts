import { normalize, JsonObject, workspaces } from '@angular-devkit/core';
import { join } from 'path';
jest.mock('tsconfig-paths-webpack-plugin');
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { of } from 'rxjs';
import * as buildWebpack from '@angular-devkit/build-webpack';
import { Architect } from '@angular-devkit/architect';
import { BuildServerlessBuilderOptions } from './build.impl';
import * as normalizeModule from '../../utils/normalize';
import { getTestArchitect } from '../../utils/testing';
import { ServerlessWrapper } from '../../utils/serverless';
import * as serverlessConfig from '../../utils/serverless.config';

describe('Serverless Build Builder', () => {
  let testOptions: BuildServerlessBuilderOptions & JsonObject;
  let architect: Architect;
  let runWebpack: jest.Mock;

  beforeEach(async () => {
    [architect] = await getTestArchitect();

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
          with: 'apps/environment/environment.prod.ts'
        }
      ],
      assets: [],
      statsJson: false
    };
    runWebpack = jest.fn().mockImplementation((config, context, options) => {
      options.logging({
        toJson: () => ({
          stats: 'stats'
        })
      });
      return of({ success: true });
    });
    (buildWebpack as any).runWebpack = runWebpack;
    spyOn(workspaces, 'readWorkspace').and.returnValue({
      workspace: {
        projects: {
          get: () => ({
            sourceRoot: '/root/apps/serverlessapp/src'
          })
        }
      }
    });
    spyOn(ServerlessWrapper, 'init').and.returnValue(of(null));
    jest
      .spyOn(serverlessConfig, 'consolidateExcludes')
      .mockImplementation((options, contex) => {
        return options.tsConfig;
      });
    jest.spyOn(ServerlessWrapper, 'serverless', 'get').mockReturnValue({
      cli: {
        log: () => {
          return;
        }
      },
      service: {
        getAllFunctions: () => {
          return [];
        }
      }
    });
    jest
      .spyOn(normalizeModule, 'getEntryForFunction')
      .mockReturnValue({ handler: '/root/apps/serverlessapp/src/handler.ts' });
    (<any>(
      TsConfigPathsPlugin
    )).mockImplementation(function MockPathsPlugin() {});
  });

  describe('run', () => {
    it('should call runWebpack', async () => {
      const run = await architect.scheduleBuilder(
        '@flowaccount/nx-serverless:build',
        testOptions
      );
      await run.output.toPromise();
      await run.stop();
      expect(runWebpack).toHaveBeenCalled();
    });

    it('should emit the outfile along with success', async () => {
      const run = await architect.scheduleBuilder(
        '@flowaccount/nx-serverless:build',
        testOptions
      );
      const output = await run.output.toPromise();
      await run.stop();
      expect(output.success).toEqual(true);
      expect(output.outfile).toEqual('/root/dist/apps/serverlessapp');
    });

    describe('webpackConfig option', () => {
      it('should require the specified function and use the return value', async () => {
        const mockFunction = jest.fn(config => ({
          config: 'config'
        }));
        jest.mock(
          join(normalize('/root'), 'apps/serverlessapp/webpack.config.js'),
          () => mockFunction,
          {
            virtual: true
          }
        );
        testOptions.webpackConfig = 'apps/serverlessapp/webpack.config.js';
        const run = await architect.scheduleBuilder(
          '@flowaccount/nx-serverless:build',
          testOptions
        );
        await run.output.toPromise();

        await run.stop();
        expect(mockFunction).toHaveBeenCalled();
        expect(runWebpack).toHaveBeenCalledWith(
          {
            config: 'config'
          },
          jasmine.anything(),
          jasmine.anything()
        );
        // expect(runWebpack.calls.first().args[0]).toEqual({
        //   config: 'config'
        // });
      });
    });
  });
});
