import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq
} from '@nrwl/nx-plugin/testing';
describe('nx-aws-cdk e2e', () => {
  beforeAll(() => {
    ensureNxProject('@flowaccount/nx-aws-cdk', 'dist/libs/nx-aws-cdk');
  });
  describe('nx-aws-cdk:ec2-instance e2e', () => {
    it('should create nx-aws-cdk:ec2-instance', async done => {
      const plugin = uniq('nx-aws-cdk');
      await runNxCommandAsync(
        `generate @flowaccount/nx-aws-cdk:ec2-instance --project ${plugin} --name ec2-test --id ec2-instance-test --imageId i-12345test --keyName test_key --subnetId subnet-1234-test --instanceType t3.micro`
      );
      const result = await runNxCommandAsync(`build ${plugin}`);
      console.log(result.stderr);
      console.log(result.stdout);
      expect(result.stdout).toContain('Builder ran');
      done();
    }, 10000);
    describe('--directory', () => {
      it('should create src in the specified directory', async done => {
        const plugin = uniq('nx-aws-cdk');
        const result = await runNxCommandAsync(
          `generate @flowaccount/nx-aws-cdk:ec2-instance --project ${plugin} --name ec2-test --id ec2-instance-test --directory subdir --imageId i-12345test --keyName test_key --subnetId subnet-1234-test --instanceType t3.micro`
        );
        console.log(result.stderr);
        console.log(result.stdout);
        expect(() =>
          checkFilesExist(
            `apps/subdir/${plugin}/cdk.ts`,
            `apps/subdir/${plugin}/tsconfig.cdk.json`,
            `apps/subdir/${plugin}/src/ec2-stack.ts`
          )
        ).not.toThrow();
        done();
      }, 10000);
    });
    describe('--tags', () => {
      it.only('should add tags to nx.json', async done => {
        const plugin = uniq('nx-aws-cdk');
        const result = await runNxCommandAsync(
          `generate @flowaccount/nx-aws-cdk:ec2-instance --project ${plugin} --name ec2-test --id ec2-instance-test --imageId i-12345test --keyName test_key --subnetId subnet-1234-test --instanceType t3.micro --tags e2etag,e2ePackage `
        );
        console.log(result.stderr);
        console.log(result.stdout);
        const nxJson = readJson('nx.json');
        expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
        done();
      }, 10000);
    });
  });
});
