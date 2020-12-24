import { Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { readJsonInTree, updateJsonInTree } from '@nrwl/workspace';
import { callRule, runSchematic } from '../../utils/testing';

describe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = Tree.empty();
    tree = createEmptyWorkspace(tree);
  });

  it('should add dependencies for node apis', async () => {
    const result = await runSchematic('init', { expressProxy: false }, tree);
    const packageJson = readJsonInTree(result, 'package.json');
    expect(
      packageJson.dependencies['@flowaccount/nx-serverless']
    ).toBeUndefined();
    expect(
      packageJson.devDependencies['@flowaccount/nx-serverless']
    ).toBeDefined();
    expect(packageJson.devDependencies['serverless']).toBeDefined();
    expect(packageJson.devDependencies['serverless-offline']).toBeDefined();
    expect(packageJson.devDependencies['@types/aws-lambda']).toBeDefined();
  });

  it('should add dependencies for universal', async () => {
    const result = await runSchematic('init', { expressProxy: true }, tree);
    const packageJson = readJsonInTree(result, 'package.json');
    expect(
      packageJson.dependencies['@flowaccount/nx-serverless']
    ).toBeUndefined();
    expect(
      packageJson.devDependencies['@flowaccount/nx-serverless']
    ).toBeDefined();
    expect(packageJson.devDependencies['serverless']).toBeDefined();
    expect(packageJson.devDependencies['serverless-offline']).toBeDefined();
    expect(
      packageJson.devDependencies['serverless-apigw-binary']
    ).toBeDefined();
    expect(
      packageJson.devDependencies['@types/aws-serverless-express']
    ).toBeDefined();
    expect(packageJson.dependencies['aws-serverless-express']).toBeDefined();
    expect(packageJson.dependencies['express']).toBeDefined();
  });

  //   describe('defaultCollection', () => {
  //     it('should be set if none was set before', async () => {
  //       const result = await runSchematic('init', {}, tree);
  //       const workspaceJson = readJsonInTree(result, 'workspace.json');
  //       expect(workspaceJson.cli.defaultCollection).toEqual('@flowaccount/nx-serverless');
  //     });

  //     it('should be set if @nrwl/workspace was set before', async () => {
  //       tree = await callRule(
  //         updateJsonInTree('workspace.json', json => {
  //           json.cli = {
  //             defaultCollection: '@nrwl/workspace'
  //           };

  //           return json;
  //         }),
  //         tree
  //       );
  //       const result = await runSchematic('init', {}, tree);
  //       const workspaceJson = readJsonInTree(result, 'workspace.json');
  //       expect(workspaceJson.cli.defaultCollection).toEqual('@flowaccount/nx-serverless');
  //     });

  //     it('should not be set if something else was set before', async () => {
  //       tree = await callRule(
  //         updateJsonInTree('workspace.json', json => {
  //           json.cli = {
  //             defaultCollection: '@nrwl/angular'
  //           };

  //           return json;
  //         }),
  //         tree
  //       );
  //       const result = await runSchematic('init', {}, tree);
  //       const workspaceJson = readJsonInTree(result, 'workspace.json');
  //       expect(workspaceJson.cli.defaultCollection).toEqual('@nrwl/angular');
  //     });
  //   });
});
