import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { join } from 'path';

import { NxAwsCdkSchematicSchema } from './schema';

describe('nx-aws-cdk schematic', () => {
  let appTree: Tree;
  const options: NxAwsCdkSchematicSchema = { name: 'test' };

  const testRunner = new SchematicTestRunner(
    '@flowaccount/nx-aws-cdk',
    join(__dirname, '../../../collection.json')
  );

  beforeEach(() => {
    appTree = createEmptyWorkspace(Tree.empty());
  });

  it('should run successfully', async () => {
    await expect(
      testRunner.runSchematicAsync('nxAwsCdk', options, appTree).toPromise()
    ).resolves.not.toThrowError();
  });
});
