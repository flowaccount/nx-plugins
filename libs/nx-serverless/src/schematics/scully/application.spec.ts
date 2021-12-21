import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import {
  readJsonInTree,
  serializeJson,
  getWorkspacePath,
} from '@nrwl/workspace';
import * as workspace from '@nrwl/workspace';
import { runSchematic } from '../../utils/testing';

describe('scully app', () => {
  let appTree: Tree;
  beforeEach(async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    appTree.overwrite(
      'package.json',
      `
      {
        "name": "test-name",
        "dependencies": {},
        "devDependencies": {
          "@nrwl/workspace": "0.0.0"
        }
      }
    `
    );
    jest.spyOn(workspace, 'getProjectConfig').mockReturnValue({
      root: 'apps/my-app',
      sourceRoot: 'apps/my-app/src',
      prefix: 'my-app',
    });
    jest
      .spyOn(workspace, 'updateWorkspaceInTree')
      .mockImplementation((callback) => {
        return (host: Tree, context: SchematicContext): Tree => {
          const path = getWorkspacePath(host);
          appTree.overwrite(
            path,
            serializeJson(
              callback(
                {
                  projects: {
                    'my-app': {
                      root: 'apps/my-app',
                      sourceRoot: 'apps/my-app/src',
                      prefix: 'my-app',
                      targets: {},
                    },
                  },
                },
                context,
                host
              )
            )
          );
          return host;
        };
      });
  });

  describe('not nested', () => {
    it('should update workspace.json', async () => {
      const tree = await runSchematic(
        'add-scully',
        { project: 'my-app', addScully: false },
        appTree
      );
      const workspaceJson = readJsonInTree(tree, '/workspace.json');
      const project = workspaceJson.projects['my-app'];
      expect(project.root).toEqual('apps/my-app');
      expect(project.targets).toEqual(
        jasmine.objectContaining({
          compile: {
            builder: '@flowaccount/nx-serverless:compile',
            configurations: {
              dev: {
                budgets: [
                  {
                    maximumWarning: '2mb',
                    maximumError: '5mb',
                    type: 'initial',
                  },
                ],
                optimization: false,
                sourceMap: false,
              },
              production: {
                budgets: [
                  {
                    maximumWarning: '2mb',
                    maximumError: '5mb',
                    type: 'initial',
                  },
                ],
                extractCss: true,
                extractLicenses: true,
                fileReplacements: [
                  {
                    replace: 'apps/my-app/environment.ts',
                    with: 'apps/my-app/environment.prod.ts',
                  },
                ],
                namedChunks: false,
                optimization: true,
                sourceMap: false,
                vendorChunk: false,
              },
            },
            options: {
              outputPath: 'dist',
              package: 'apps/my-app',
              processEnvironmentFile: 'env.json',
              serverlessConfig: 'apps/my-app/serverless.ts',
              servicePath: 'apps/my-app',
              tsConfig: 'apps/my-app/tsconfig.serverless.json',
              skipClean: true,
            },
          },
          deploy: {
            builder: '@flowaccount/nx-serverless:deploy',
            options: {
              waitUntilTargets: ['my-app:scully'],
              buildTarget: 'my-app:compile:production',
              config: 'apps/my-app/serverless.ts',
              location: 'dist/apps/my-app',
              package: 'dist/apps/my-app',
            },
          },
          destroy: {
            builder: '@flowaccount/nx-serverless:destroy',
            options: {
              buildTarget: 'my-app:compile:production',
              config: 'apps/my-app/serverless.ts',
              location: 'dist/apps/my-app',
              package: 'dist/apps/my-app',
            },
          },
          scully: {
            builder: '@flowaccount/nx-serverless:scully',
            options: {
              buildTarget: 'my-app:build:production',
              configFiles: ['apps/my-app/scully.config.js'],
              scanRoutes: true,
              removeStaticDist: true,
              skipBuild: false,
            },
          },
          offline: {
            builder: '@flowaccount/nx-serverless:offline',
            configurations: {
              dev: {
                buildTarget: 'my-app:compile:dev',
              },
              production: {
                buildTarget: 'my-app:compile:production',
              },
            },
            options: {
              waitUntilTargets: ['my-app:scully'],
              buildTarget: 'my-app:compile',
              config: 'apps/my-app/serverless.ts',
              location: 'dist/apps/my-app',
            },
          },
        })
      );
    });

    it('should generate files', async () => {
      const tree = await runSchematic(
        'add-scully',
        { project: 'my-app', addScully: false },
        appTree
      );
      expect(tree.exists('apps/my-app/env.json')).toBeTruthy();
      expect(tree.exists('apps/my-app/scully.config.js')).toBeTruthy();
      expect(tree.exists('apps/my-app/server-prerender.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app/serve-static.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app/handler.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app/tsconfig.serverless.json')).toBeTruthy();
      expect(tree.exists('apps/my-app/serverless.ts')).toBeTruthy();
      const tsconfig = readJsonInTree(
        tree,
        'apps/my-app/tsconfig.serverless.json'
      );
      expect(tsconfig.compilerOptions.types).toContain('node');
      expect(tsconfig.files).toEqual(['handler.ts', 'server-prerender.ts']);
    });
  });

  // describe('nested', () => {
  //   it('should update workspace.json', async () => {
  //     const tree = await runSchematic(
  //       'scully-app',
  //       { name: 'myServelessApp', directory: 'myDir' },
  //       appTree
  //     );
  //     const workspaceJson = readJsonInTree(tree, '/workspace.json');

  //     expect(workspaceJson.projects['my-dir-my-serveless-app'].root).toEqual(
  //       'apps/my-dir/my-serveless-app'
  //     );

  //     expect(
  //       workspaceJson.projects['my-dir-my-serveless-app'].targets.lint
  //     ).toEqual({
  //       builder: '@angular-devkit/build-angular:tslint',
  //       options: {
  //         tsConfig: [
  //           'apps/my-dir/my-serveless-app/tsconfig.app.json',
  //           'apps/my-dir/my-serveless-app/tsconfig.spec.json'
  //         ],
  //         exclude: ['**/node_modules/**', '!apps/my-dir/my-serveless-app/**']
  //       }
  //     });

  //     expect(workspaceJson.projects['my-dir-my-serveless-app-e2e']).toBeUndefined();
  //     expect(workspaceJson.defaultProject).toEqual('my-dir-my-serveless-app');
  //   });

  //   it('should generate files', async () => {
  //     const tree = await runSchematic(
  //       'scully-app',
  //       { name: 'myServelessApp', directory: 'myDir' },
  //       appTree
  //     );
  //     // const hasJsonValue = ({ path, expectedValue, lookupFn }) => {
  //     //   const content = getFileContent(tree, path);
  //     //   const config = JSON.parse(stripJsonComments(content));
  //     //   expect(lookupFn(config)).toEqual(expectedValue);
  //     // };
  //     // Make sure these exist
  //     [
  //       'apps/my-dir/my-serveless-app/env.json',
  //       'apps/my-dir/my-serveless-app/src/handler.ts',
  //       'apps/my-dir/my-serveless-app/serverless.ts'
  //     ].forEach(path => {
  //       expect(tree.exists(path)).toBeTruthy();
  //     });
  //   });
  // });

  //   describe('--unit-test-runner none', () => {
  //     it('should not generate test configuration', async () => {
  //       const tree = await runSchematic(
  //         'scully-app',
  //         { project: 'myServelessApp', addUniversal: false },
  //         appTree
  //       );
  //       expect(tree.exists('apps/my-serveless-app/src/test-setup.ts')).toBeFalsy();
  //       expect(tree.exists('apps/my-serveless-app/src/test.ts')).toBeFalsy();
  //       expect(tree.exists('apps/my-serveless-app/tsconfig.spec.json')).toBeFalsy();
  //       expect(tree.exists('apps/my-serveless-app/jest.config.js')).toBeFalsy();
  //       const workspaceJson = readJsonInTree(tree, 'workspace.json');
  //       expect(
  //         workspaceJson.projects['my-serveless-app'].targets.test
  //       ).toBeUndefined();
  //       expect(
  //         workspaceJson.projects['my-serveless-app'].targets.lint.options.tsConfig
  //       ).toEqual(['apps/my-serveless-app/tsconfig.app.json']);
  //     });
  //   });
});
