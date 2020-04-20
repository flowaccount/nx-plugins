import { normalize, JsonObject, workspaces } from '@angular-devkit/core';
import { join } from 'path';
jest.mock('tsconfig-paths-webpack-plugin');
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { of } from 'rxjs';
import * as compileTypscript from '../../utils/typescript';
import { Architect } from '@angular-devkit/architect';
import * as normalizeModule from '../../utils/normalize';
import { getTestArchitect } from '../../utils/testing';
import { ServerlessWrapper } from '../../utils/serverless';
import { ServerlessBaseOptions } from '../../utils/types';
import * as depcheck from '../../utils/depcheck';
describe('Serverless Compile Builder', () => {
  let testOptions: ServerlessBaseOptions & JsonObject;
  let architect: Architect;
  let compileTypeScriptFiles: jest.Mock;
  // let dependencyCheck: jest.Mock;
  // dependencyCheck = jest.fn().mockImplementation(() => {
  //   return of({});
  // });
  // (depcheck as any).dependencyCheck = dependencyCheck;
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
    compileTypeScriptFiles = jest.fn().mockImplementation(() => {
      return of({ success: true });
    });

    (compileTypscript as any).compileTypeScriptFiles = compileTypeScriptFiles;
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
    it('should call compileTypeScriptFiles', async () => {
      const run = await architect.scheduleBuilder(
        '@flowaccount/nx-serverless:compile',
        testOptions
      );
      await run.output.toPromise();
      await run.stop();
      expect(compileTypeScriptFiles).toHaveBeenCalled();
    });
    // it('should call dependencyCheck function', async() => {

    //   const run = await architect.scheduleBuilder(
    //     '@flowaccount/nx-serverless:compile',
    //     testOptions
    //   );
    //   await run.output.toPromise();
    //   await run.stop();
    //   expect(dependencyCheck).toHaveBeenCalled();

    // });
    it('should emit the outfile along with success', async () => {
      const run = await architect.scheduleBuilder(
        '@flowaccount/nx-serverless:compile',
        testOptions
      );
      const output = await run.output.toPromise();
      await run.stop();
      expect(output.success).toEqual(true);
      expect(output.outfile).toEqual('/root/dist/apps/serverlessapp');
    });
  });
});
