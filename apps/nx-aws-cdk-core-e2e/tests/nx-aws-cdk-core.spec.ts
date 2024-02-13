import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nx/plugin/testing';
describe('nx-aws-cdk-core e2e', () => {
  it('should create nx-aws-cdk-core', async (done) => {
    console.log('shits');
    const plugin = uniq('nx-aws-cdk-core');
    ensureNxProject(
      '@flowaccount/nx-aws-cdk-core',
      'dist/libs/nx-aws-cdk-core'
    );
    await runNxCommandAsync(
      `generate @flowaccount/nx-aws-cdk-core:nx-aws-cdk-core ${plugin}`
    );

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Executor ran');

    done();
  });

  describe('--directory', () => {
    it('should create src in the specified directory', async (done) => {
      const plugin = uniq('nx-aws-cdk-core');
      ensureNxProject(
        '@flowaccount/nx-aws-cdk-core',
        'dist/libs/nx-aws-cdk-core'
      );
      await runNxCommandAsync(
        `generate @flowaccount/nx-aws-cdk-core:nx-aws-cdk-core ${plugin} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
      ).not.toThrow();
      done();
    });
  });

  describe('--tags', () => {
    it('should add tags to nx.json', async (done) => {
      const plugin = uniq('nx-aws-cdk-core');
      ensureNxProject(
        '@flowaccount/nx-aws-cdk-core',
        'dist/libs/nx-aws-cdk-core'
      );
      await runNxCommandAsync(
        `generate @flowaccount/nx-aws-cdk-core:nx-aws-cdk-core ${plugin} --tags e2etag,e2ePackage`
      );
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
      done();
    });
  });
});
