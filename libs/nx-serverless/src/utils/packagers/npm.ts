/**
 * NPM packager.
 */

import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { spawn, spawnSync, SpawnSyncReturns } from 'child_process';
import { PackageManager } from './package-manager';
import { OperatorFunction } from 'rxjs';

export class NPM implements PackageManager {
  private command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

  get name() {
    return 'npm';
  }

  get lockfileName() {
    return 'package-lock.json';
  }
  get copyPackageSectionNames() {
    return [];
  }
  get mustCopyModules() {
    return true;
  }

  getProdDependencies(cwd: string, depth?: number): SpawnSyncReturns<Buffer> {
    // Get first level dependency graph

    const args = [
      'ls',
      '-prod', // Only prod dependencies
      '-json',
      `-depth=${depth || 1}`
    ];

    const ignoredNpmErrors = [
      { npmError: 'extraneous', log: false },
      { npmError: 'missing', log: false },
      { npmError: 'peer dep missing', log: true }
    ];

    const result = spawnSync(this.command, args, { cwd });

    if (result.error) {
      const err = result.error;
      if (err instanceof Error) {
        // Only exit with an error if we have critical npm errors for 2nd level inside
        const errors = _.split(err.name, '\n');
        const failed = _.reduce(
          errors,
          (failed, error) => {
            if (failed) {
              return true;
            }
            return (
              !_.isEmpty(error) &&
              !_.some(ignoredNpmErrors, ignoredError =>
                _.startsWith(error, `npm ERR! ${ignoredError.npmError}`)
              )
            );
          },
          false
        );

        if (!failed && !_.isEmpty(err.stack)) {
          return Promise.resolve({ stdout: err.message }) as any;
        }
      }
      return result;
    } else {
      return result;
    }
  }

  install(
    cwd: string,
    options?: Record<string, any>
  ): SpawnSyncReturns<Buffer> {
    const args = ['install'];

    return spawnSync(this.command, args, { cwd, ...options });
  }

  prune(cwd: string, options?: Record<string, any>): SpawnSyncReturns<Buffer> {
    const args = ['prune'];

    return spawnSync(this.command, args, { cwd, ...options });
  }

  runScripts(
    cwd: string,
    scriptNames: (value: string, index: number) => SpawnSyncReturns<Buffer>
  ): OperatorFunction<string, SpawnSyncReturns<Buffer>> {
    return map(scriptNames, scriptName => {
      const args = ['run', scriptName];

      return spawn(this.command, args, { cwd });
    });
  }

  generateLockFile(cwd: string): SpawnSyncReturns<Buffer> {
    const args = ['install', '--package-lock'];

    return spawnSync(this.command, args, { cwd });
  }
}
