import { Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { runSchematic } from '../../utils/testing';

fdescribe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = Tree.empty();
    tree = createEmptyWorkspace(tree);
  });

  it('should add dependencies for node apis', async () => {
    const result = await runSchematic('init', { expressApp: false }, tree);
    const packageJson = readJsonInTree(result, 'package.json');
    expect(packageJson.dependencies['@flowaccount/nx-aws-cdk']).toBeUndefined();
    expect(
      packageJson.devDependencies['@flowaccount/nx-aws-cdk']
    ).toBeDefined();
    expect(packageJson.devDependencies['aws-cdk']).toBeDefined();
    expect(packageJson.devDependencies['@aws-cdk/core']).toBeDefined();
    expect(packageJson.devDependencies['@types/aws-lambda']).toBeDefined();
  });

  it('should add dependencies for expressApp', async () => {
    const result = await runSchematic(
      'init',
      { expressApp: true, ec2Instance: false },
      tree
    );
    const packageJson = readJsonInTree(result, 'package.json');
    expect(packageJson.dependencies['@flowaccount/nx-aws-cdk']).toBeUndefined();
    expect(
      packageJson.devDependencies['@flowaccount/nx-aws-cdk']
    ).toBeDefined();
    expect(packageJson.devDependencies['aws-cdk']).toBeDefined();
    expect(packageJson.devDependencies['@aws-cdk/core']).toBeDefined();
    expect(
      packageJson.devDependencies['serverless-apigw-binary']
    ).toBeDefined();
    expect(
      packageJson.devDependencies['@types/aws-serverless-express']
    ).toBeDefined();
    expect(packageJson.dependencies['aws-serverless-express']).toBeDefined();
    expect(packageJson.dependencies['express']).toBeDefined();
  });

  it('should add dependencies for ec2Instance', async () => {
    const result = await runSchematic(
      'init',
      { expressApp: false, ec2Instance: true },
      tree
    );
    const packageJson = readJsonInTree(result, 'package.json');
    expect(packageJson.dependencies['@flowaccount/nx-aws-cdk']).toBeUndefined();
    expect(
      packageJson.devDependencies['@flowaccount/nx-aws-cdk']
    ).toBeDefined();
    expect(packageJson.devDependencies['aws-cdk']).toBeDefined();
    expect(packageJson.devDependencies['@aws-cdk/core']).toBeDefined();
    expect(packageJson.devDependencies['@aws-cdk/aws-ec2']).toBeDefined();
  });

  //   describe('defaultCollection', () => {
  //     it('should be set if none was set before', async () => {
  //       const result = await runSchematic('init', {}, tree);
  //       const workspaceJson = readJsonInTree(result, 'workspace.json');
  //       expect(workspaceJson.cli.defaultCollection).toEqual('@flowaccount/nx-aws-cdk');
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
  //       expect(workspaceJson.cli.defaultCollection).toEqual('@flowaccount/nx-aws-cdk');
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
