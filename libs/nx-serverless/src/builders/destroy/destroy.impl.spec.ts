import { JsonObject, workspaces } from '@angular-devkit/core';
jest.mock('tsconfig-paths-webpack-plugin');
import { of } from 'rxjs';
import * as deploy from '../deploy/deploy.impl';
import { Architect } from '@angular-devkit/architect';
import { getTestArchitect } from '../../utils/testing';
import { ServerlessWrapper } from '../../utils/serverless';
import { EventEmitter } from 'events';

describe('ServerlessBuildBuilder', () => {
  let testOptions: JsonObject;
  let architect: Architect;
  let startBuild: jest.Mock;
  let fakeEventEmitter: EventEmitter;
  beforeEach(async () => {
    fakeEventEmitter = new EventEmitter();
    (fakeEventEmitter as any).pid = 123;
    
    [architect] = await getTestArchitect();
    testOptions = {
      buildTarget: 'serverlessapp:build:production',
      location: 'dist/apps/serverlessapp',
      package: 'dist/apps/serverlessapp',
      config: 'apps/serverlessapp/serverless.yml',
      waitUntilTargets:[]
    };
    startBuild = jest.fn().mockImplementation(() => {
      return of({ success: true });
    });
    (deploy as any).startBuild = startBuild;
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
    jest.spyOn(ServerlessWrapper, 'serverless', 'get').mockReturnValue({
      cli: {
        log: () => { return; }
      },
      config: {
        servicePath: '/root/apps/serverlessapp/src'
      },
      service: {
        getAllFunctions: () => {
          return [];
        }
      },
      run: () => {
        return new Promise(() => { 
          Promise.resolve(fakeEventEmitter);
        })
      }
    });
  });
  describe('run', () => {
    it('should call startBuild', done => {
      architect.scheduleBuilder(
        '@flowaccount/nx-serverless:destroy',
        testOptions
      ).then((run) => {
        run.output.subscribe({
              next: output => {
                expect(startBuild).toHaveBeenCalled();
                run.stop();
            },
            complete: () => {
            done();
          }
        })
        fakeEventEmitter.emit('exit', 0);
      })
     
    });

    it('should call serverless run with success', async (done) => {
     const run = await architect.scheduleBuilder(
        '@flowaccount/nx-serverless:destroy',
        testOptions
      )
        run.output.subscribe({
              next: output => {
                expect(output.success).toEqual(true);
                run.stop();
            },
            complete: () => {
            done();
          }
        })
        fakeEventEmitter.emit('exit', 0);
      })
    
  });
});