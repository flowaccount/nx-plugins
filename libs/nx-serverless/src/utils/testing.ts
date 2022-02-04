import { join } from 'path';
import {
  createEmptyWorkspace,
} from '@nrwl/workspace/testing';
import { externalSchematic, Rule, Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';

const testRunner = new SchematicTestRunner(
  '@flowaccount/nx-serverless',
  join(__dirname, '../../collection.json')
);

export function runSchematic<SchemaOptions = any>(
  schematicName: string,
  options: SchemaOptions,
  tree: Tree
) {
  return testRunner.runSchematicAsync(schematicName, options, tree).toPromise();
}

export function callRule(rule: Rule, tree: Tree) {
  return testRunner.callRule(rule, tree).toPromise();
}

// export async function getMockContext() {
//   const registry = new schema.CoreSchemaRegistry();
//   registry.addPostTransform(schema.transforms.addUndefinedDefaults);

//   const architectHost = new TestingArchitectHost('/root', '/root');
//   const architect = new Architect(architectHost, registry);

//   await architectHost.addBuilderFromPackage(join(__dirname, '../..'));

//   const context = new MockBuilderContext(architect, architectHost);
//   await context.addBuilderFromPackage(join(__dirname, '../..'));
//   await context.addTarget({ project: 'test', target: 'test' }, 'build');

//   return [architect, context] as [Architect, MockBuilderContext];
// }

export async function createTestUILib(
  libName: string,
  buildable = true
): Promise<Tree> {
  let appTree = createEmptyWorkspace(Tree.empty());
  appTree = await callRule(
    externalSchematic('@flowaccount/nx-serverless', 'library', {
      name: libName,
      buildable,
    }),
    appTree
  );

  return appTree;
}
