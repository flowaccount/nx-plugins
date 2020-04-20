import { Tree, SchematicContext } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import {
  readJsonInTree,
  serializeJson,
  getWorkspacePath
} from '@nrwl/workspace';
import * as workspace from '@nrwl/workspace';
import { runSchematic } from '../../utils/testing';

describe('express app', () => {
  let appTree: Tree;
  beforeEach(async () => {
    appTree = Tree.empty();
    appTree = createEmptyWorkspace(appTree);
    jest.spyOn(workspace, 'getProjectConfig').mockReturnValue({
      root: 'apps/my-app',
      sourceRoot: 'apps/my-app/src',
      prefix: 'my-app'
    });
    jest
      .spyOn(workspace, 'updateWorkspaceInTree')
      .mockImplementation(callback => {
        return (host: Tree, context: SchematicContext): Tree => {
          const path = getWorkspacePath(host);
          host.overwrite(
            path,
            serializeJson(
              callback(
                {
                  projects: {
                    'my-app': {
                      root: 'apps/my-app',
                      sourceRoot: 'apps/my-app/src',
                      prefix: 'my-app',
                      architect: {}
                    }
                  }
                },
                context
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
        'express',
        { project: 'my-app', initExpress: false },
        appTree
      );
      const workspaceJson = readJsonInTree(tree, '/workspace.json');
      const project = workspaceJson.projects['my-app'];
      expect(project.root).toEqual('apps/my-app');
      expect(project.architect).toEqual(
        jasmine.objectContaining({
          compile: {
            builder: '@flowaccount/nx-serverless:compile',
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
                    replace: 'apps/my-app/environment.ts',
                    with: 'apps/my-app/environment.prod.ts'
                  }
                ],
                namedChunks: false,
                optimization: true,
                sourceMap: false,
                vendorChunk: false
              }
            },
            options: {
              outputPath: 'dist',
              package: 'apps/my-app',
              processEnvironmentFile: 'env.json',
              serverlessConfig: 'apps/my-app/serverless.yml',
              servicePath: 'apps/my-app',
              tsConfig: 'apps/my-app/tsconfig.serverless.json',
              skipClean: true
            }
          },
          deploy: {
            builder: '@flowaccount/nx-serverless:deploy',
            options: {
              waitUntilTargets: ['my-app:build:production'],
              buildTarget: 'my-app:compile:production',
              config: 'apps/my-app/serverless.yml',
              location: 'dist/apps/my-app',
              package: 'dist/apps/my-app'
            }
          },
          destroy: {
            builder: '@flowaccount/nx-serverless:destroy',
            options: {
              buildTarget: 'my-app:compile:production',
              config: 'apps/my-app/serverless.yml',
              location: 'dist/apps/my-app',
              package: 'dist/apps/my-app'
            }
          },
          offline: {
            builder: '@flowaccount/nx-serverless:offline',
            configurations: {
              dev: {
                buildTarget: 'my-app:compile:dev'
              },
              production: {
                buildTarget: 'my-app:compile:production'
              }
            },
            options: {
              waitUntilTargets: ['my-app:build'],
              buildTarget: 'my-app:compile',
              config: 'apps/my-app/serverless.yml',
              location: 'dist/apps/my-app'
            }
          }
        })
      );
    });
    it('should generate files', async () => {
      const tree = await runSchematic(
        'express',
        { project: 'my-app', initExpress: false },
        appTree
      );
      expect(tree.exists('apps/my-app/env.json')).toBeTruthy();
      expect(tree.exists('apps/my-app/handler.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app/tsconfig.serverless.json')).toBeTruthy();
      expect(tree.exists('apps/my-app/serverless.yml')).toBeTruthy();
      const tsconfig = readJsonInTree(
        tree,
        'apps/my-app/tsconfig.serverless.json'
      );
      expect(tsconfig.compilerOptions.types).toContain('node');
      expect(tsconfig.files).toEqual(['handler.ts']);
    });
  });

  describe('nested', () => {
    it('should update workspace.json', async () => {
      const tree = await runSchematic(
        'express',
        { name: 'my-app', directory: 'myDir' },
        appTree
      );
      const workspaceJson = readJsonInTree(tree, '/workspace.json');

      expect(workspaceJson.projects['my-dir-my-app'].root).toEqual(
        'apps/my-dir/my-app'
      );

      expect(
        workspaceJson.projects['my-dir-my-app'].architect.lint
      ).toEqual({
        builder: '@angular-devkit/build-angular:tslint',
        options: {
          tsConfig: [
            'apps/my-dir/my-serveless-app/tsconfig.app.json',
            'apps/my-dir/my-serveless-app/tsconfig.spec.json'
          ],
          exclude: ['**/node_modules/**', '!apps/my-dir/my-app/**']
        }
      });

      expect(workspaceJson.projects['my-dir-my-app-e2e']).toBeUndefined();
      expect(workspaceJson.defaultProject).toEqual('my-dir-my-app');
    });

    it('should generate files', async () => {
      const tree = await runSchematic(
        'express',
        { name: 'my-app', directory: 'myDir' },
        appTree
      );
      [
        'apps/my-dir/my-app/env.json',
        'apps/my-dir/my-app/src/handler.ts',
        'apps/my-app/tsconfig.serverless.json',
        'apps/my-dir/my-app/serverless.yml'
      ].forEach(path => {
        expect(tree.exists(path)).toBeTruthy();
      });
      const tsconfig = readJsonInTree(
        tree,
        'apps/my-dir/my-app/tsconfig.serverless.json'
      );
      expect(tsconfig.compilerOptions.types).toContain('node');
      expect(tsconfig.files).toEqual(['handler.ts']);
    });
  });

    describe('--unit-test-runner none', () => {
      it('should not generate test configuration', async () => {
        const tree = await runSchematic(
          'express',
          { project: 'my-App', initExpress: true },
          appTree
        );
        expect(tree.exists('apps/my-app/src/test-setup.ts')).toBeFalsy();
        expect(tree.exists('apps/my-app/src/test.ts')).toBeFalsy();
        expect(tree.exists('apps/my-app/tsconfig.spec.json')).toBeFalsy();
        expect(tree.exists('apps/my-app/jest.config.js')).toBeFalsy();
        const workspaceJson = readJsonInTree(tree, 'workspace.json');
        expect(
          workspaceJson.projects['my-app'].architect.test
        ).toBeUndefined();
        expect(
          workspaceJson.projects['my-app'].architect.lint.options.tsConfig
        ).toEqual(['apps/my-app/tsconfig.app.json']);
      });
    });
});
