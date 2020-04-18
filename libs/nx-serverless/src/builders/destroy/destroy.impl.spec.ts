import { JsonObject, workspaces } from '@angular-devkit/core';
jest.mock('tsconfig-paths-webpack-plugin');
import { of } from 'rxjs';
import * as deploy from '../deploy/deploy.impl';
import * as destroy from './destroy.impl';
import { getMockContext } from '../../utils/testing';
import { ServerlessWrapper } from '../../utils/serverless';
import { serverlessExecutionHandler } from './destroy.impl';
import { ServerlessDeployBuilderOptions } from '../deploy/deploy.impl';
import { MockBuilderContext } from '@nrwl/workspace/testing';

describe('ServerlessBuildBuilder', () => {
  let testOptions: JsonObject & ServerlessDeployBuilderOptions;
  // let architect: Architect;
  let startBuild: jest.Mock;
  let getExecArgv: jest.Mock;
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
    startBuild = jest
      .spyOn(deploy, 'startBuild')
      .mockReturnValue(
        of({ success: true, resolverName: '', tsconfig: '', outfile: '' })
      );
    getExecArgv = jest.spyOn(destroy, 'getExecArgv').mockReturnValue([]);
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
    // it('should call getExecArgv', async () => {
    //   await (destroy as any).serverlessExecutionHandler(testOptions, context).toPromise();
    //   expect(getExecArgv).toHaveBeenCalled();
    // }, 2000);
    it('should call startBuild', async () => {
      await serverlessExecutionHandler(testOptions, context).toPromise();
      expect(startBuild).toHaveBeenCalled();
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
