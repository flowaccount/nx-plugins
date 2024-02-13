import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nx/plugin/testing';
describe('nx-serverless e2e', () => {
  beforeAll(() => {
    ensureNxProject('@flowaccount/nx-serverless', 'dist/libs/nx-serverless');
  });
  describe('nx-serverless:api-serverless e2e', () => {
    it('should create nx-serverless:api-serverless', async (done) => {
      const plugin = uniq('nx-serverless');
      await runNxCommandAsync(
        `generate @flowaccount/nx-serverless:api-serverless ${plugin}`
      );
      const result = await runNxCommandAsync(`build ${plugin}`);
      expect(result.stdout).toContain(`[./apps/${plugin}/src/handler.ts]`);
      done();
    }, 90000);
    describe('--directory', () => {
      it('should create src in the specified directory', async (done) => {
        const plugin = uniq('nx-serverless');
        await runNxCommandAsync(
          `generate @flowaccount/nx-serverless:api-serverless ${plugin} --directory subdir`
        );
        expect(() =>
          checkFilesExist(
            `apps/subdir/${plugin}/src/handler.ts`,
            `apps/subdir/${plugin}/env.json`,
            `apps/subdir/${plugin}/environment.ts`,
            `apps/subdir/${plugin}/environment.prod.ts`,
            `apps/subdir/${plugin}/jest.config.js`,
            `apps/subdir/${plugin}/serverless.yml`,
            `apps/subdir/${plugin}/tsconfig.app.json`,
            `apps/subdir/${plugin}/tsconfig.json`,
            `apps/subdir/${plugin}/tsconfig.spec.json`,
            `apps/subdir/${plugin}/tslint.json`
          )
        ).not.toThrow();
        done();
      }, 10000);
    });

    describe('--tags', () => {
      it('should add tags to nx.json', async (done) => {
        const plugin = uniq('nx-serverless');
        await runNxCommandAsync(
          `generate @flowaccount/nx-serverless:api-serverless ${plugin} --tags e2etag,e2ePackage`
        );
        const nxJson = readJson('nx.json');
        expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
        done();
      }, 10000);
    });
  }),
    describe('nx-serverless:express e2e test', () => {
      it('should create nx-serverless:express', async (done) => {
        const plugin = uniq('nx-serverless-express');
        await runNxCommandAsync(
          `generate @flowaccount/nx-serverless:express ${plugin} --initExpress true`
        );
        const result = await runNxCommandAsync(`build ${plugin}`);
        expect(result.stdout).toContain('Built at:');
        done();
      }, 90000);
      it('should compile nx-serverless:express', async (done) => {
        const plugin = uniq('nx-serverless-express');
        await runNxCommandAsync(
          `generate @flowaccount/nx-serverless:express ${plugin} --initExpress true`
        );
        const result = await runNxCommandAsync(`run ${plugin}:compile`);
        expect(result.stdout).toContain(`Done compiling TypeScript files`);
        done();
      }, 90000);
      describe('--directory', () => {
        it('should create src in the specified directory', async (done) => {
          const plugin = uniq('nx-serverless-express');
          await runNxCommandAsync(
            `generate @flowaccount/nx-serverless:express ${plugin} --directory subdir --initExpress true`
          );
          expect(() =>
            checkFilesExist(
              `apps/subdir/${plugin}/src/main.ts`,
              `apps/subdir/${plugin}/handler.ts`,
              `apps/subdir/${plugin}/env.json`,
              `apps/subdir/${plugin}/src/environments/environment.ts`,
              `apps/subdir/${plugin}/src/environments/environment.prod.ts`,
              `apps/subdir/${plugin}/jest.config.js`,
              `apps/subdir/${plugin}/serverless.yml`,
              `apps/subdir/${plugin}/tsconfig.app.json`,
              `apps/subdir/${plugin}/tsconfig.serverless.json`,
              `apps/subdir/${plugin}/tsconfig.json`,
              `apps/subdir/${plugin}/tsconfig.spec.json`,
              `apps/subdir/${plugin}/tslint.json`
            )
          ).not.toThrow();
          done();
        }, 10000);
      });

      describe('--tags', () => {
        it('should add tags to nx.json', async (done) => {
          const plugin = uniq('nx-serverless-express');
          await runNxCommandAsync(
            `generate @flowaccount/nx-serverless:express ${plugin} --tags e2etag,e2ePackage --initExpress=true`
          );
          const nxJson = readJson('nx.json');
          expect(nxJson.projects[plugin].tags).toEqual([
            'e2etag',
            'e2ePackage',
          ]);
          done();
        }, 10000);
      });
    });
});
