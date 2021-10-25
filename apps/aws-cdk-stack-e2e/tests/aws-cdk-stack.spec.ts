import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('aws-cdk-stack e2e', () => {
  it('should create aws-cdk-stack', async () => {
    const plugin = uniq('aws-cdk-stack');
    ensureNxProject('@flowaccount/aws-cdk-stack', 'dist/apps/aws-cdk-e2e');
    await runNxCommandAsync(
      `generate @flowaccount/aws-cdk-stack:api-serverless ${plugin}`
    );

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Executor ran');
  }, 2000);

});
