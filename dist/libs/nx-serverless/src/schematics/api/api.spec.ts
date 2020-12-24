import { Tree } from '@angular-devkit/schematics';
const stripJsonComments = require('strip-json-comments');
import { createEmptyWorkspace, getFileContent } from '@nrwl/workspace/testing';

import { NxJson, readJsonInTree } from '@nrwl/workspace';
import { runSchematic } from '../../utils/testing';
// import { createApp } from '../../../../angular/src/utils/testing';

describe('node api app', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  describe('not nested', () => {
    it('should update workspace.json', async () => {
      const tree = await runSchematic(
        'api-serverless',
        { name: 'myServelessApp' },
        appTree
      );
      const workspaceJson = readJsonInTree(tree, '/workspace.json');
      const project = workspaceJson.projects['my-serveless-app'];
      expect(project.root).toEqual('apps/my-serveless-app');
      expect(project.architect).toEqual(
        jasmine.objectContaining({
          build: {
            builder: '@flowaccount/nx-serverless:build',
            configurations: {
              dev: {
                budgets: [
                  {
                    maximumWarning: '2mb',
                    maximumError: '5mb',
                    type: 'initial'
                  }
                ],
                optimization: false,
                sourceMap: false
              },
              production: {
                budgets: [
                  {
                    maximumWarning: '2mb',
                    maximumError: '5mb',
                    type: 'initial'
                  }
                ],
                extractCss: true,
                extractLicenses: true,
                fileReplacements: [
                  {
                    replace: 'apps/my-serveless-app/environment.ts',
                    with: 'apps/my-serveless-app/environment.prod.ts'
                  }
                ],
                namedChunks: false,
                optimization: true,
                sourceMap: false,
                vendorChunk: false
              }
            },
            options: {
              outputPath: 'dist/apps/my-serveless-app',
              package: 'apps/my-serveless-app',
              processEnvironmentFile: 'env.json',
              serverlessConfig: 'apps/my-serveless-app/serverless.yml',
              servicePath: 'apps/my-serveless-app',
              tsConfig: 'apps/my-serveless-app/tsconfig.app.json'
            }
          },
          deploy: {
            builder: '@flowaccount/nx-serverless:deploy',
            options: {
              buildTarget: 'my-serveless-app:build:production',
              config: 'apps/my-serveless-app/serverless.yml',
              location: 'dist/apps/my-serveless-app',
              package: 'dist/apps/my-serveless-app'
            }
          },
          destroy: {
            builder: '@flowaccount/nx-serverless:destroy',
            options: {
              buildTarget: 'my-serveless-app:build:production',
              config: 'apps/my-serveless-app/serverless.yml',
              location: 'dist/apps/my-serveless-app',
              package: 'dist/apps/my-serveless-app'
            }
          },
          lint: {
            builder: '@angular-devkit/build-angular:tslint',
            options: {
              exclude: ['**/node_modules/**', '!apps/my-serveless-app/**'],
              tsConfig: [
                'apps/my-serveless-app/tsconfig.app.json',
                'apps/my-serveless-app/tsconfig.spec.json'
              ]
            }
          },
          serve: {
            builder: '@flowaccount/nx-serverless:offline',
            configurations: {
              dev: {
                buildTarget: 'my-serveless-app:build:dev'
              },
              production: {
                buildTarget: 'my-serveless-app:build:production'
              }
            },
            options: {
              buildTarget: 'my-serveless-app:build',
              config: 'apps/my-serveless-app/serverless.yml',
              location: 'dist/apps/my-serveless-app'
            }
          },
          test: {
            builder: '@nrwl/jest:jest',
            options: {
              jestConfig: 'apps/my-serveless-app/jest.config.js',
              passWithNoTests: true,
              tsConfig: 'apps/my-serveless-app/tsconfig.spec.json'
            }
          }
        })
      );
      expect(workspaceJson.projects['my-serveless-app'].architect.lint).toEqual(
        {
          builder: '@angular-devkit/build-angular:tslint',
          options: {
            tsConfig: [
              'apps/my-serveless-app/tsconfig.app.json',
              'apps/my-serveless-app/tsconfig.spec.json'
            ],
            exclude: ['**/node_modules/**', '!apps/my-serveless-app/**']
          }
        }
      );
      expect(workspaceJson.projects['my-serveless-app-e2e']).toBeUndefined();
      expect(workspaceJson.defaultProject).toEqual('my-serveless-app');
    });

    it('should update nx.json', async () => {
      const tree = await runSchematic(
        'api-serverless',
        { name: 'myServelessApp', tags: 'one,two' },
        appTree
      );
      const nxJson = readJsonInTree<NxJson>(tree, '/nx.json');
      expect(nxJson).toEqual(
        jasmine.objectContaining({
          npmScope: 'proj',
          projects: {
            'my-serveless-app': {
              tags: ['one', 'two']
            }
          }
        })
      );
    });

    it('should generate files', async () => {
      const tree = await runSchematic(
        'api-serverless',
        { name: 'myServelessApp' },
        appTree
      );
      expect(tree.exists('apps/my-serveless-app/jest.config.js')).toBeTruthy();
      expect(tree.exists('apps/my-serveless-app/env.json')).toBeTruthy();
      expect(tree.exists('apps/my-serveless-app/environment.ts')).toBeTruthy();
      expect(
        tree.exists('apps/my-serveless-app/environment.prod.ts')
      ).toBeTruthy();
      expect(tree.exists('apps/my-serveless-app/src/handler.ts')).toBeTruthy();
      expect(tree.exists('apps/my-serveless-app/serverless.yml')).toBeTruthy();

      const tsconfig = readJsonInTree(
        tree,
        'apps/my-serveless-app/tsconfig.json'
      );
      expect(tsconfig.extends).toEqual('../../tsconfig.json');
      expect(tsconfig.compilerOptions.types).toContain('node');
      expect(tsconfig.compilerOptions.types).toContain('jest');

      const tsconfigApp = JSON.parse(
        stripJsonComments(
          getFileContent(tree, 'apps/my-serveless-app/tsconfig.app.json')
        )
      );
      expect(tsconfigApp.compilerOptions.outDir).toEqual('../../dist/out-tsc');
      expect(tsconfigApp.extends).toEqual('./tsconfig.json');

      const tslintJson = JSON.parse(
        stripJsonComments(
          getFileContent(tree, 'apps/my-serveless-app/tslint.json')
        )
      );
      expect(tslintJson.extends).toEqual('../../tslint.json');
    });
  });

  describe('nested', () => {
    it('should update workspace.json', async () => {
      const tree = await runSchematic(
        'api-serverless',
        { name: 'myServelessApp', directory: 'myDir' },
        appTree
      );
      const workspaceJson = readJsonInTree(tree, '/workspace.json');

      expect(workspaceJson.projects['my-dir-my-serveless-app'].root).toEqual(
        'apps/my-dir/my-serveless-app'
      );

      expect(
        workspaceJson.projects['my-dir-my-serveless-app'].architect.lint
      ).toEqual({
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: [
            'apps/my-dir/my-serveless-app/tsconfig.app.json',
            'apps/my-dir/my-serveless-app/tsconfig.spec.json'
          ],
          exclude: ['**/node_modules/**', '!apps/my-dir/my-serveless-app/**']
        }
      });

      expect(
        workspaceJson.projects['my-dir-my-serveless-app-e2e']
      ).toBeUndefined();
      expect(workspaceJson.defaultProject).toEqual('my-dir-my-serveless-app');
    });

    it('should update nx.json', async () => {
      const tree = await runSchematic(
        'api-serverless',
        { name: 'myServelessApp', directory: 'myDir', tags: 'one,two' },
        appTree
      );
      const nxJson = readJsonInTree<NxJson>(tree, '/nx.json');
      expect(nxJson).toEqual(
        jasmine.objectContaining({
          npmScope: 'proj',
          projects: {
            'my-dir-my-serveless-app': {
              tags: ['one', 'two']
            }
          }
        })
      );
    });

    it('should generate files', async () => {
      const hasJsonValue = ({ path, expectedValue, lookupFn }) => {
        const content = getFileContent(tree, path);
        const config = JSON.parse(stripJsonComments(content));

        expect(lookupFn(config)).toEqual(expectedValue);
      };
      const tree = await runSchematic(
        'api-serverless',
        { name: 'myServelessApp', directory: 'myDir' },
        appTree
      );

      // Make sure these exist
      [
        'apps/my-dir/my-serveless-app/jest.config.js',
        'apps/my-dir/my-serveless-app/env.json',
        'apps/my-dir/my-serveless-app/environment.ts',
        'apps/my-dir/my-serveless-app/environment.prod.ts',
        'apps/my-dir/my-serveless-app/src/handler.ts',
        'apps/my-dir/my-serveless-app/serverless.yml'
      ].forEach(path => {
        expect(tree.exists(path)).toBeTruthy();
      });

      // Make sure these have properties
      [
        {
          path: 'apps/my-dir/my-serveless-app/tsconfig.json',
          lookupFn: json => json.extends,
          expectedValue: '../../../tsconfig.json'
        },
        {
          path: 'apps/my-dir/my-serveless-app/tsconfig.app.json',
          lookupFn: json => json.compilerOptions.outDir,
          expectedValue: '../../../dist/out-tsc'
        },
        {
          path: 'apps/my-dir/my-serveless-app/tsconfig.app.json',
          lookupFn: json => json.compilerOptions.types,
          expectedValue: ['node']
        },
        {
          path: 'apps/my-dir/my-serveless-app/tslint.json',
          lookupFn: json => json.extends,
          expectedValue: '../../../tslint.json'
        }
      ].forEach(hasJsonValue);
    });
  });

  describe('--unit-test-runner none', () => {
    it('should not generate test configuration', async () => {
      const tree = await runSchematic(
        'api-serverless',
        { name: 'myServelessApp', unitTestRunner: 'none' },
        appTree
      );
      expect(
        tree.exists('apps/my-serveless-app/src/test-setup.ts')
      ).toBeFalsy();
      expect(tree.exists('apps/my-serveless-app/src/test.ts')).toBeFalsy();
      expect(
        tree.exists('apps/my-serveless-app/tsconfig.spec.json')
      ).toBeFalsy();
      expect(tree.exists('apps/my-serveless-app/jest.config.js')).toBeFalsy();
      const workspaceJson = readJsonInTree(tree, 'workspace.json');
      expect(
        workspaceJson.projects['my-serveless-app'].architect.test
      ).toBeUndefined();
      expect(
        workspaceJson.projects['my-serveless-app'].architect.lint.options
          .tsConfig
      ).toEqual(['apps/my-serveless-app/tsconfig.app.json']);
    });
  });

  //   describe('frontendProject', () => {
  //     it('should configure proxy', async () => {
  //       appTree = createApp(appTree, 'my-frontend');

  //       const tree = await runSchematic(
  //         'app',
  //         { name: 'myServelessApp', frontendProject: 'my-frontend' },
  //         appTree
  //       );

  //       expect(tree.exists('apps/my-frontend/proxy.conf.json')).toBeTruthy();
  //       const serve = JSON.parse(tree.readContent('workspace.json')).projects[
  //         'my-frontend'
  //       ].architect.serve;
  //       expect(serve.options.proxyConfig).toEqual(
  //         'apps/my-frontend/proxy.conf.json'
  //       );
  //     });

  //     it('should work with unnormalized project names', async () => {
  //       appTree = createApp(appTree, 'myFrontend');

  //       const tree = await runSchematic(
  //         'app',
  //         { name: 'myServelessApp', frontendProject: 'myFrontend' },
  //         appTree
  //       );

  //       expect(tree.exists('apps/my-frontend/proxy.conf.json')).toBeTruthy();
  //       const serve = JSON.parse(tree.readContent('workspace.json')).projects[
  //         'my-frontend'
  //       ].architect.serve;
  //       expect(serve.options.proxyConfig).toEqual(
  //         'apps/my-frontend/proxy.conf.json'
  //       );
  //     });
  //   });
});
