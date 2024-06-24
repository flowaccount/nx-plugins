import { join } from 'path';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Rule, Tree } from '@angular-devkit/schematics';
// import { TestingArchitectHost } from '@angular-devkit/architect/testing';
// import { schema } from '@angular-devkit/core';
// import { Architect } from '@angular-devkit/architect';
// import { MockBuilderContext } from '@nx/workspace/testing';

const testRunner = new SchematicTestRunner(
  '@flowaccount/nx-aws-cdk',
  join(__dirname, '../../collection.json')
);

export function runSchematic(schematicName: string, options: any, tree: Tree) {
  return testRunner.runSchematic(schematicName, options, tree);
}

// export function runExternalSchematic(
//   packageName,
//   schematicName: string,
//   options: any,
//   tree: Tree
// ) {
//   return testRunner
//     .runExternalSchematicAsync(packageName, schematicName, options, tree)
//     .toPromise();
// }

// export function callRule(rule: Rule, tree: Tree) {
//   return testRunner.callRule(rule, tree).toPromise();
// }

// export async function getTestArchitect() {
//   const architectHost = new TestingArchitectHost('/root', '/root');
//   const registry = new schema.CoreSchemaRegistry();
//   registry.addPostTransform(schema.transforms.addUndefinedDefaults);

//   const architect = new Architect(architectHost, registry);

//   await architectHost.addBuilderFromPackage(join(__dirname, '../..'));

//   return [architect, architectHost] as [Architect, TestingArchitectHost];
// }

// export async function getMockContext() {
//   const [architect, architectHost] = await getTestArchitect();

//   const context = new MockBuilderContext(architect, architectHost);
//   await context.addBuilderFromPackage(join(__dirname, '../..'));
//   return context;
// }
