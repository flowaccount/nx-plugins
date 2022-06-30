import { map } from 'rxjs/operators';

/**
 * NPM packager.
 */
import * as _ from 'lodash';
import { spawn, spawnSync } from 'child_process';

export class NPM {
  static get lockfileName() {
    // eslint-disable-line lodash/prefer-constant
    return 'package-lock.json';
  }

  static get copyPackageSectionNames() {
    return [];
  }

  static get mustCopyModules() {
    // eslint-disable-line lodash/prefer-constant
    return true;
  }

  static getProdDependencies(cwd, depth) {
    // Get first level dependency graph
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
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

    const result = spawnSync(command, args, {
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
              !_.some(ignoredNpmErrors, ignoredError =>
                _.startsWith(error, `npm ERR! ${ignoredError.npmError}`)
              )
            );
          },
          false
        );

        if (!failed && !_.isEmpty(err.stack)) {
          return Promise.resolve({ stdout: err.message });
        }
      }
      return result;
    } else {
      return result;
    }
    // .then(processOutput => processOutput.stdout)
    // .then(depJson => Promise.try(() => JSON.parse(depJson)));
  }

  static _rebaseFileReferences(pathToPackageRoot, moduleVersion) {
    if (/^file:[^/]{2}/.test(moduleVersion)) {
      const filePath = _.replace(moduleVersion, /^file:/, '');
      return _.replace(`file:${pathToPackageRoot}/${filePath}`, /\\/g, '/');
    }

    return moduleVersion;
  }

  /**
   * We should not be modifying 'package-lock.json'
   * because this file should be treated as internal to npm.
   *
   * Rebase package-lock is a temporary workaround and must be
   * removed as soon as https://github.com/npm/npm/issues/19183 gets fixed.
   */
  static rebaseLockfile(pathToPackageRoot, lockfile) {
    if (lockfile.version) {
      lockfile.version = NPM._rebaseFileReferences(
        pathToPackageRoot,
        lockfile.version
      );
    }

    if (lockfile.dependencies) {
      _.forIn(lockfile.dependencies, lockedDependency => {
        NPM.rebaseLockfile(pathToPackageRoot, lockedDependency);
      });
    }

    return lockfile;
  }

  static async install(cwd) {
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const args = ['install'];

    return await spawn(command, args, { cwd });
  }

  static async prune(cwd) {
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const args = ['prune'];

    return await spawn(command, args, { cwd });
  }

  static async runScripts(cwd, scriptNames) {
    const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    return map(scriptNames, async (scriptName) => {
      const args = ['run', scriptName];

      return await spawn(command, args, { cwd });
    });
  }
}
