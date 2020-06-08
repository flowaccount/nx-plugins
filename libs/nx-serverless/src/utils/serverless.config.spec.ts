import { EventEmitter } from 'events';
import { getMockContext } from './testing';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import { removeSync } from 'fs-extra';
jest.mock('fs-extra');
import { consolidateExcludes } from './serverless.config';
import { BuildBuilderOptions } from './types';
import { ServerlessWrapper } from './serverless';
import { of } from 'rxjs';
import { join } from 'path';
jest.mock('glob');
jest.mock('@nrwl/workspace/src/utils/fileutils');
const fsUtility = require('@nrwl/workspace/src/utils/fileutils');
jest.mock('child_process');
const { fork } = require('child_process');
import { workspaces, Path } from '@angular-devkit/core';

describe('Serverless Config Manipulations', () => {
  let testOptions: BuildBuilderOptions;
  let context: MockBuilderContext;
  let fakeEventEmitter: EventEmitter;
  beforeEach(async () => {
    fakeEventEmitter = new EventEmitter();
    (fakeEventEmitter as any).pid = 123;
    fork.mockReturnValue(fakeEventEmitter);
    fsUtility.readJsonFile.mockImplementation((arg: string) => {
      if (arg.endsWith('tsconfig.app.json')) {
        return {
          extends: './tsconfig.json',
          compilerOptions: {
            outDir: '../../dist/out-tsc',
            declaration: true,
            rootDir: './src',
            types: ['node']
          },
          exclude: ['**/*.spec.ts'],
          include: ['**/*.ts']
        };
      } else {
        return {
          name: 'serverlessapp'
        };
      }
    });
    spyOn(workspaces, 'readWorkspace').and.returnValue({
      workspace: {
        projects: {
          get: () => ({
            sourceRoot: '/root/apps/serverlessapp/src'
          })
        }
      }
    });
    fsUtility.writeJsonFile.mockImplementation(() => {});
    jest.spyOn(ServerlessWrapper, 'init').mockReturnValue(of(null));
    jest.spyOn(ServerlessWrapper, 'serverless', 'get').mockReturnValue({
      cli: {
        log: () => {
          return;
        }
      },
      service: {
        getAllFunctions: () => {
          return [];
        },
        package: {
          exclude: []
        },
        plugins: {}
      },
      pluginManager: {
        parsePluginsObject: () => {
          return { localPath: '/.serverless_plugins/**' };
        }
      }
    });
    context = await getMockContext();
    context.target.project = 'serverlessapp';
    testOptions = {
      assets: [],
      sourceRoot: 'apps/serverlessapp/src' as Path,
      outputPath: 'dist/apps/serverlessapp',
      tsConfig: 'apps/serverlessapp/tsconfig.app.json',
      watch: false,
      sourceMap: false,
      package: 'apps/serverlessapp',
      serverlessConfig: 'apps/serverlessapp/serverless.yml',
      servicePath: 'apps/serverlessapp',
      processEnvironmentFile: 'env.json',
      externalDependencies: 'all'
      // files: { 'src/handler': '/src/handler.ts' }
    };
  });
  describe('Consolidate Excludes', () => {
    beforeEach(() => {
      // mock createProjectGraph without deps
    });
    it('should succeed without any excludes config', () => {
      testOptions.files = {
        'src/handler': '/root/apps/serverlessapp/src/handler.ts'
      };
      testOptions.sourceRoot = '/root/apps/serverlessapp/src' as Path;
      const result = consolidateExcludes(testOptions, context);
      expect(result).toEqual(
        '/root/apps/serverlessapp/tsconfig.serverless.nx-tmp'
      );
    });
  });
});
