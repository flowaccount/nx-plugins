import { Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';

import { readJsonInTree } from '@nrwl/workspace';
import { runSchematic } from '../../utils/testing';
// import { createApp } from '../../../../angular/src/utils/testing';

fdescribe('app', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
  });

  describe('not nested', () => {
    it('should update workspace.json', async () => {
      const tree = await runSchematic('universal-app', { project: 'myServelessApp', addUniversal: false }, appTree);
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
                vendorChunk: false,
              }
            },
            options: {
              outputPath: 'dist/apps/my-serveless-app',
              package: 'apps/my-serveless-app',
              progress: true,
              serverlessConfig: 'apps/my-serveless-app/serverless.yml',
              servicePath: 'apps/my-serveless-app',
              tsConfig: 'apps/my-serveless-app/tsconfig.app.json',
              watch: true
            }
          },
          deploy: {
            builder: '@flowaccount/nx-serverless:deploy',
            options: {
              waitUntilTargets: [
                'my-serveless-app:build:production',
                'my-serveless-app:server',
              ],
              buildTarget: 'my-serveless-app:build:production',
              config: 'apps/my-serveless-app/serverless.yml',
              location: 'dist/apps/my-serveless-app',
              package: 'dist/apps/my-serveless-app'
            }
          },
          lint: {
            builder: '@angular-devkit/build-angular:tslint',
            options: {
              exclude: [
                '**/node_modules/**',
                '!apps/my-serveless-app/**'
              ],
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
              waitUntilTargets: [
                'my-serveless-app:build:production',
                'my-serveless-app:server',
              ],
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
      expect(workspaceJson.projects['my-serveless-app'].architect.lint).toEqual({
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: [
            'apps/my-serveless-app/tsconfig.app.json',
            'apps/my-serveless-app/tsconfig.spec.json'
          ],
          exclude: ['**/node_modules/**', '!apps/my-serveless-app/**']
        }
      });
      expect(workspaceJson.projects['my-serveless-app-e2e']).toBeUndefined();
      expect(workspaceJson.defaultProject).toEqual('my-serveless-app');
    });

    it('should generate files', async () => {
      const tree = await runSchematic('universal-app', { project: 'myServelessApp', addUniversal: false }, appTree);
      expect(tree.exists('apps/my-serveless-app/env.json')).toBeTruthy();
      expect(tree.exists('apps/my-serveless-app/src/handler.ts')).toBeTruthy();
      expect(tree.exists('apps/my-serveless-app/serverless.yml')).toBeTruthy();

      // const tsconfig = readJsonInTree(tree, 'apps/my-serveless-app/tsconfig.json');
      // expect(tsconfig.compilerOptions.types).toContain('node');
      // expect(tsconfig.compilerOptions.types).toContain('jest');

      // const tsconfigApp = JSON.parse(
      //   stripJsonComments(
      //     getFileContent(tree, 'apps/my-serveless-app/tsconfig.app.json')
      //   )
      // );
      // expect(tsconfigApp.compilerOptions.outDir).toEqual('../../dist/out-tsc');
      // expect(tsconfigApp.extends).toEqual('./tsconfig.json');

      // const tslintJson = JSON.parse(
      //   stripJsonComments(getFileContent(tree, 'apps/my-serveless-app/tslint.json'))
      // );
      // expect(tslintJson.extends).toEqual('../../tslint.json');
    });
  });

  // describe('nested', () => {
  //   it('should update workspace.json', async () => {
  //     const tree = await runSchematic(
  //       'universal-app',
  //       { name: 'myServelessApp', directory: 'myDir' },
  //       appTree
  //     );
  //     const workspaceJson = readJsonInTree(tree, '/workspace.json');

  //     expect(workspaceJson.projects['my-dir-my-serveless-app'].root).toEqual(
  //       'apps/my-dir/my-serveless-app'
  //     );

  //     expect(
  //       workspaceJson.projects['my-dir-my-serveless-app'].architect.lint
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
  //       'universal-app',
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
  //       'apps/my-dir/my-serveless-app/serverless.yml'
  //     ].forEach(path => {
  //       expect(tree.exists(path)).toBeTruthy();
  //     });
  //   });
  // });

//   describe('--unit-test-runner none', () => {
//     it('should not generate test configuration', async () => {
//       const tree = await runSchematic(
//         'universal-app',
//         { project: 'myServelessApp', addUniversal: false },
//         appTree
//       );
//       expect(tree.exists('apps/my-serveless-app/src/test-setup.ts')).toBeFalsy();
//       expect(tree.exists('apps/my-serveless-app/src/test.ts')).toBeFalsy();
//       expect(tree.exists('apps/my-serveless-app/tsconfig.spec.json')).toBeFalsy();
//       expect(tree.exists('apps/my-serveless-app/jest.config.js')).toBeFalsy();
//       const workspaceJson = readJsonInTree(tree, 'workspace.json');
//       expect(
//         workspaceJson.projects['my-serveless-app'].architect.test
//       ).toBeUndefined();
//       expect(
//         workspaceJson.projects['my-serveless-app'].architect.lint.options.tsConfig
//       ).toEqual(['apps/my-serveless-app/tsconfig.app.json']);
//     });
//   });
// });
