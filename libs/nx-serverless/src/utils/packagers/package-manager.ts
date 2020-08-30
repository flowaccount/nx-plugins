import * as _ from 'lodash';
import { NPM } from './npm';
import { Yarn } from './yarn';
import * as detectPackageManager from 'detect-package-manager';
import { SpawnSyncReturns } from 'child_process';
import { OperatorFunction } from 'rxjs';

const registeredPackagers = { npm: NPM, yarn: Yarn };

export async function packageManagerFactory(
  cwd: string,
  packageManagerId?: string
): Promise<PackageManager> {
  const packageManagerOnSystem = await detectPackageManager(cwd);

  const packageManager = packageManagerId
    ? packageManagerId.toLowerCase()
    : packageManagerOnSystem;

  if (!_.has(registeredPackagers, packageManager)) {
    return null;
  }

  return new registeredPackagers[packageManager]();
}

export interface PackageManagerInstallOptions {
  ignoreScripts: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PackageManagerPruneOptions
  extends PackageManagerInstallOptions {}

export interface PackageManager {
  name: string;
  lockfileName: string;
  copyPackageSectionNames: Array<string>;
  mustCopyModules: boolean;

  getProdDependencies(cwd: string, depth: number): SpawnSyncReturns<Buffer>;

  install(
    cwd: string,
    options?: PackageManagerInstallOptions
  ): SpawnSyncReturns<Buffer>;

  prune(
    cwd: string,
    options?: PackageManagerInstallOptions
  ): SpawnSyncReturns<Buffer>;

  runScripts(
    cwd: string,
    scriptNames: (value: string, index: number) => SpawnSyncReturns<Buffer>
  ): OperatorFunction<string, SpawnSyncReturns<Buffer>>;

  generateLockFile(cwd: string): SpawnSyncReturns<Buffer>;
}
