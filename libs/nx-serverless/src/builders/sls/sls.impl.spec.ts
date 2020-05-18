import { JsonObject, workspaces } from '@angular-devkit/core';
jest.mock('tsconfig-paths-webpack-plugin');
import { of } from 'rxjs';
import * as sls from './sls.impl';
import { getMockContext } from '../../utils/testing';
import { ServerlessWrapper } from '../../utils/serverless';
import { serverlessExecutionHandler } from './sls.impl';
import { ServerlesSlsBuilderOptions } from './sls.impl';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import * as targetSchedulers from '../../utils/target.schedulers';
import * as packagers from '../../utils/packagers';

describe('Serverless Deploy Builder', () => {
  let testOptions: JsonObject & ServerlesSlsBuilderOptions;
  // let architect: Architect;
  let getExecArgv: jest.SpyInstance;
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
      args: [],
      list: false
    };
    jest.spyOn(sls, 'getExecArgv').mockReturnValue([]);
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
    // it('should call getExecArgv', async () => {
    //   await serverlessExecutionHandler(testOptions, context).toPromise();
    //   expect(deploy.getExecArgv).toHaveBeenCalled();
    // });
    it('should call serverless run with success', async () => {
      const output = await serverlessExecutionHandler(
        testOptions,
        context
      ).toPromise();
      expect(output.success).toEqual(true);
    });
  });
});
