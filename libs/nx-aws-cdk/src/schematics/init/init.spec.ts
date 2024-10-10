import { readPackageJson } from '@nx/workspace';

describe('init', () => {
  it('should add dependencies for node apis', async () => {
    const packageJson = readPackageJson();
    console.log(packageJson);
    expect(packageJson.dependencies['@flowaccount/nx-aws-cdk']).toBeUndefined();
    expect(packageJson.devDependencies['aws-cdk']).toBeDefined();
    expect(packageJson.devDependencies['aws-cdk-lib']).toBeDefined();
  });
});
