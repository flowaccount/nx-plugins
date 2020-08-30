/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */

import * as _ from 'lodash';
import { spawn, spawnSync, SpawnSyncReturns } from 'child_process';
import { map } from 'rxjs/operators';
import {
  PackageManager,
  PackageManagerInstallOptions
} from './package-manager';
import { OperatorFunction } from 'rxjs';

export class Yarn implements PackageManager {
  private command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';

  get name(): string {
    return 'yarn';
  }

  get lockfileName(): string {
    return 'yarn.lock';
  }

  get copyPackageSectionNames(): Array<string> {
    return ['resolutions'];
  }

  get mustCopyModules(): boolean {
    return false;
  }

  getProdDependencies(cwd: string, depth?: number): SpawnSyncReturns<Buffer> {
    const args = ['list', `--depth=${depth || 1}`, '--json', '--production'];

    // If we need to ignore some errors add them here
    const ignoredYarnErrors = [];

    const result = spawnSync(this.command, args, {
      cwd: cwd
    });

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
              !_.some(ignoredYarnErrors, ignoredError =>
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
    }
    return result;
  }

  install(
    cwd: string,
    options?: PackageManagerInstallOptions
  ): SpawnSyncReturns<Buffer> {
    const args = ['install', '--no-lockfile', '--non-interactive'];

    // Convert supported packagerOptions
    if (options.ignoreScripts) {
      args.push('--ignore-scripts');
    }

    return spawnSync(this.command, args, { cwd });
  }

  prune(
    cwd: string,
    options?: PackageManagerInstallOptions
  ): SpawnSyncReturns<Buffer> {
    // "Yarn install" prunes automatically
    return this.install(cwd, options);
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
    const args = ['generate-lock-entry'];
    return spawnSync(this.command, args, {
      cwd: cwd
    });
  }
}
