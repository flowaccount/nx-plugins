import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq
} from '@nrwl/nx-plugin/testing';
describe('flowaccount-nx-serverless e2e', () => {
  it('should create flowaccount-nx-serverless', async done => {
    const plugin = uniq('flowaccount-nx-serverless');
    ensureNxProject(
      '@flowaccount-nx-plugins/flowaccount/nx-serverless',
      'dist/libs/nx-serverless'
    );
    await runNxCommandAsync(
      `generate @flowaccount-nx-plugins/flowaccount/nx-serverless:flowaccountNxServerless ${plugin}`
    );

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Builder ran');

    done();
  });

  describe('--directory', () => {
    it('should create src in the specified directory', async done => {
      const plugin = uniq('flowaccount-nx-serverless');
      ensureNxProject(
        '@flowaccount-nx-plugins/flowaccount/nx-serverless',
        'dist/libs/nx-serverless'
      );
      await runNxCommandAsync(
        `generate @flowaccount-nx-plugins/flowaccount/nx-serverless:flowaccountNxServerless ${plugin} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
      ).not.toThrow();
      done();
    });
  });

  describe('--tags', () => {
    it('should add tags to nx.json', async done => {
      const plugin = uniq('flowaccount-nx-serverless');
      ensureNxProject(
        '@flowaccount-nx-plugins/flowaccount/nx-serverless',
        'dist/libs/nx-serverless'
      );
      await runNxCommandAsync(
        `generate @flowaccount-nx-plugins/flowaccount/nx-serverless:flowaccountNxServerless ${plugin} --tags e2etag,e2ePackage`
      );
      const nxJson = readJson('nx.json');
      expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
      done();
    });
  });
});
