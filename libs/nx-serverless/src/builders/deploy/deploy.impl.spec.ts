let buildOptions;
import { JsonObject } from '@angular-devkit/core';
jest.mock('tsconfig-paths-webpack-plugin');
const fsExtra = require('fs-extra');
jest.mock('fs-extra');
jest.mock('@nrwl/devkit');
const devkit = require('@nrwl/devkit');
import { of } from 'rxjs';
const serverless = require('../../utils/serverless');
import { getExecArgv, ServerlessWrapper } from '../../utils/serverless';
import { deployExecutor } from './deploy.impl';
import { ServerlessDeployBuilderOptions } from './deploy.impl';
import * as packagers from '../../utils/packagers';
import { ExecutorContext } from '@nrwl/devkit';

describe('Serverless Deploy Builder', () => {
  let testOptions: JsonObject & ServerlessDeployBuilderOptions;
  let context: ExecutorContext;
  beforeEach(async () => {
    buildOptions = {};
    // [architect] = await getTestArchitect();
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
      buildTarget: 'serverlessapp:build:production',
      location: 'dist/apps/serverlessapp',
      package: 'dist/apps/serverlessapp',
      config: 'apps/serverlessapp/serverless.ts',
      waitUntilTargets: [],
      inspect: false,
      host: null,
      function: null,
      port: 7777,
      watch: false,
      stage: 'dev',
      updateConfig: false,
      args: null,
      list: false,
      ignoreScripts: false,
    };
    jest.spyOn(serverless, 'getExecArgv').mockImplementation(() => {
      return [];
    });
    jest
      .spyOn(packagers, 'preparePackageJson')
      .mockReturnValue(of({ success: true }));
    (devkit.runExecutor as any).mockImplementation(function* () {
      yield {
        success: true,
        outfile: 'outfile.js',
        resolverName: 'WebpackDependencyResolver',
        tsconfig: 'tsconfig.json',
      };
    });
    (devkit.readTargetOptions as any).mockImplementation(() => buildOptions);

    (devkit.parseTargetString as any).mockImplementation(
      jest.requireActual('@nrwl/devkit').parseTargetString
    );
    jest.spyOn(ServerlessWrapper, 'init').mockReturnValue(of(null));
    jest.spyOn(ServerlessWrapper, 'serverless', 'get').mockReturnValue({
      cli: {
        log: () => {
          return;
        },
      },
      processedInput: {},
      config: {
        servicePath: '/root/apps/serverlessapp/src',
      },
      service: {
        getAllFunctions: () => {
          return [];
        },
      },
      run: () => {
        return Promise.resolve({ success: true });
      },
    });
    fsExtra.copy.mockImplementation(() => {
      return Promise.resolve({ success: true });
    });
  });
  describe('run', () => {
    it('should build the application and start the built file', async () => {
      await deployExecutor(testOptions, context);
      expect(require('@nrwl/devkit').runExecutor).toHaveBeenCalled();
    });
    it('should call runWaitUntilTargets', async () => {
      await deployExecutor(testOptions, context);
      expect(packagers.preparePackageJson).toHaveBeenCalled();
    });
    // How do i expect a mock function to be called?
    it('should call getExecArgv', async () => {
      await deployExecutor(testOptions, context);
      expect(serverless.getExecArgv).toHaveBeenCalled();
    });
    it('should call serverless run with success', async () => {
      const output = await deployExecutor(testOptions, context);
      expect(output.success).toEqual(true);
    });
  });
});
