import { JsonObject, workspaces } from '@angular-devkit/core';
jest.mock('tsconfig-paths-webpack-plugin');
import { of } from 'rxjs';
import * as scullyRunner from './scully.impl';
import { getMockContext } from '../../utils/testing';
import { scullyCmdRunner } from './scully.impl';
import { ScullyBuilderOptions } from './scully.impl';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import * as targetSchedulers from '../../utils/target.schedulers';
import * as architect from '';

describe('Scully Builder', () => {
  let testOptions: JsonObject & ScullyBuilderOptions;
  // let architect: Architect;
  let scheduleTargetAndForget: jest.Mock;
  let startBuild: jest.SpyInstance;
  let getExecArgv: jest.SpyInstance;
  let context: MockBuilderContext;
  let scheduleBuilder: jest.SpyInstance;
  beforeEach(async () => {
    context = await getMockContext();
    testOptions = {
      buildTarget: 'serverlessapp:build:production',
      skipBuild: false,
      configFiles: ['scully.config.js'],
      showGuessError: true,
      showBrowser: false,
      removeStaticDist: true,
      scanRoutes: true
    };
    startBuild = jest.fn().mockReturnValue(of({ success: true }));
    (targetSchedulers as any).startBuild = startBuild;
    scheduleBuilder = jest.spyOn(context, 'scheduleBuilder').mockReturnValue(
      Promise.resolve({
        id: 0,
        stop: Promise.resolve,
        info: null,
        progress: null,
        result: Promise.resolve({ success: true }),
        output: of({ success: true })
      })
    );
    // getExecArgv = jest.spyOn(scullyRunner, 'getExecArgv').mockReturnValue([]);
    // scheduleBuilder = jest.fn().mockImplementation((waitUntilTargets, context)=> {
    //     return of({success: true});
    // })
    // (packagers as any).preparePackageJson = preparePackageJson;
  });
  describe('run', () => {
    it('should call startBuild', async () => {
      await scullyCmdRunner(testOptions, context).toPromise();
      expect(startBuild).toHaveBeenCalled();
    });
    it('should call scheduleBuilder @nrwl/workspace:run-commands with correct options', async () => {
      await scullyCmdRunner(testOptions, context).toPromise();
      expect(scheduleBuilder).toHaveBeenCalled();
      expect(scheduleBuilder).toHaveBeenCalledWith(
        '@nrwl/workspace:run-commands',
        {
          commands: [
            {
              command:
                'scully --configFile=scully.config.js --showGuessError=true --showBrowser=false --removeStaticDist=true --scanRoutes=true'
            }
          ],
          cwd: testOptions.root,
          color: true,
          parallel: false
        }
      );
    });
    // it('should call getExecArgv', async () => {
    //   await scullyCmdRunner(testOptions, context).toPromise();
    //   expect(getExecArgv).toHaveBeenCalled();
    // });
    it('should call scully run with success', async () => {
      const output = await scullyCmdRunner(testOptions, context).toPromise();
      expect(output.success).toEqual(true);
    });
  });
});
