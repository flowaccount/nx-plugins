import { JsonObject, workspaces } from '@angular-devkit/core';
jest.mock('tsconfig-paths-webpack-plugin');
const fsExtra = require('fs-extra');
jest.mock('fs-extra');
import { of } from 'rxjs';
const serverless = require('../../utils/serverless');
import { getMockContext } from '../../utils/testing';
import { ServerlessWrapper } from '../../utils/serverless';
import { serverlessExecutionHandler } from './deploy.impl';
import { ServerlessDeployBuilderOptions } from './deploy.impl';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import * as targetSchedulers from '../../utils/target.schedulers';
import * as packagers from '../../utils/packagers';

describe('Serverless Deploy Builder', () => {
  let testOptions: JsonObject & ServerlessDeployBuilderOptions;
  // let architect: Architect;
  let context: MockBuilderContext;
  beforeEach(async () => {
    context = await getMockContext();
    // [architect] = await getTestArchitect();
    testOptions = {
      buildTarget: 'serverlessapp:build:production',
      location: 'dist/apps/serverlessapp',
      package: 'dist/apps/serverlessapp',
      config: 'apps/serverlessapp/serverless.yml',
      waitUntilTargets: [],
      inspect: false,
      host: null,
      function: null,
      port: 7777,
      watch: false,
      stage: 'dev',
      updateConfig: false,
      args: null,
      list: false
    };
    jest.spyOn(serverless, 'getExecArgv').mockImplementation(() => {
      return [];
    });
    jest
      .spyOn(packagers, 'preparePackageJson')
      .mockReturnValue(of({ success: true }));
    jest
      .spyOn(targetSchedulers, 'runWaitUntilTargets')
      .mockReturnValue(
        of({ success: true, resolverName: '', tsconfig: '', outfile: '' })
      );
    jest
      .spyOn(targetSchedulers, 'startBuild')
      .mockReturnValue(of({ success: true }));
    jest.spyOn(ServerlessWrapper, 'init').mockReturnValue(of(null));
    jest.spyOn(ServerlessWrapper, 'serverless', 'get').mockReturnValue({
      cli: {
        log: () => {
          return;
        }
      },
      processedInput: {},
      config: {
        servicePath: '/root/apps/serverlessapp/src'
      },
      service: {
        getAllFunctions: () => {
          return [];
        }
      },
      run: () => {
        return Promise.resolve({ success: true });
      }
    });
    fsExtra.copy.mockImplementation(() => {
      return Promise.resolve({ success: true });
    });
  });
  describe('run', () => {
    it('should call runWaitUntilTargets', async () => {
      await serverlessExecutionHandler(testOptions, context).toPromise();
      expect(targetSchedulers.runWaitUntilTargets).toHaveBeenCalled();
    });
    it('should call startBuild', async () => {
      await serverlessExecutionHandler(testOptions, context).toPromise();
      expect(targetSchedulers.startBuild).toHaveBeenCalled();
    });
    it('should call runWaitUntilTargets', async () => {
      await serverlessExecutionHandler(testOptions, context).toPromise();
      expect(packagers.preparePackageJson).toHaveBeenCalled();
    });
    // How do i expect a mock function to be called?
    it('should call getExecArgv', async () => {
      await serverlessExecutionHandler(testOptions, context).toPromise();
      expect(serverless.getExecArgv).toHaveBeenCalled();
    });
    it('should call serverless run with success', async () => {
      const output = await serverlessExecutionHandler(
        testOptions,
        context
      ).toPromise();
      expect(output.success).toEqual(true);
    });
  });
});
