import { packageManagerFactory } from './package-manager';
import { NPM } from './npm';
import { Yarn } from './yarn';
import { dirname } from 'path';

const packageJsonPath = dirname('dist/apps/serverlessapp/package.json');

describe('PackageManger', () => {
  describe('packageManagerFactory', () => {
    it('should return null when package manager is not supported', () => {
      packageManagerFactory(
        packageJsonPath,
        'unknown-package-manager'
      ).then(packageManager => expect(packageManager).toBeNull());
    });

    it('should return NPM when package manager', () => {
      packageManagerFactory(packageJsonPath, 'npm').then(packageManager =>
        expect(packageManager).toBeInstanceOf(NPM)
      );
    });

    it('should return YARN when package manager', () => {
      packageManagerFactory(packageJsonPath, 'yarn').then(packageManager =>
        expect(packageManager).toBeInstanceOf(Yarn)
      );
    });

    it('should return YARN or NPM when empty constructor', () => {
      packageManagerFactory(packageJsonPath).then(packageManager =>
        expect(packageManager).toBeInstanceOf(Yarn || NPM)
      );
    });
  });
});
