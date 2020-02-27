import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq
} from '@nrwl/nx-plugin/testing';
describe('nx-aws-cdk e2e', () => {
  it('should create nx-aws-cdk', async done => {
    const plugin = uniq('nx-aws-cdk');
    ensureNxProject('@flowaccount/nx-aws-cdk', 'dist/libs/nx-aws-cdk');
    await runNxCommandAsync(
      `generate @flowaccount/nx-aws-cdk:nxAwsCdk ${plugin}`
    );

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Builder ran');

    done();
  });

  describe('--directory', () => {
    it('should create src in the specified directory', async done => {
      const plugin = uniq('nx-aws-cdk');
      ensureNxProject('@flowaccount/nx-aws-cdk', 'dist/libs/nx-aws-cdk');
      await runNxCommandAsync(
        `generate @flowaccount/nx-aws-cdk:nxAwsCdk ${plugin} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
      ).not.toThrow();
      done();
    });
  });

  describe('--tags', () => {
    it('should add tags to nx.json', async done => {
      const plugin = uniq('nx-aws-cdk');
      ensureNxProject('@flowaccount/nx-aws-cdk', 'dist/libs/nx-aws-cdk');
      await runNxCommandAsync(
        `generate @flowaccount/nx-aws-cdk:nxAwsCdk ${plugin} --tags e2etag,e2ePackage`
      );
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
      done();
    });
  });
});
