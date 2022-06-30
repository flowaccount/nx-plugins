/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */

import { logger } from '@nrwl/devkit';
import { exec } from 'child_process';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { promisify } from 'util';


const execAsync = promisify(exec);

export class Yarn {
  static get lockfileName() {
    // eslint-disable-line lodash/prefer-constant
    return 'yarn.lock';
  }

  static get copyPackageSectionNames() {
    return ['resolutions'];
  }

  static get mustCopyModules() {
    // eslint-disable-line lodash/prefer-constant
    return false;
  }

  static async generateLockFile(cwd) {
    const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
    const args = 'install';
    return await execAsync(`${command} ${args}`, {
      cwd: cwd,
    });
  }

  static async getProdDependencies(cwd, depth) {
    const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
    const args = `list --depth=${depth || 1} --json --production`;

    // If we need to ignore some errors add them here
    // const ignoredYarnErrors = [];
    // const result =
    const result = await execAsync(`${command} ${args}`, {
      cwd: cwd,
    });
    if(result.stderr) {
      logger.error(result.stderr.trim())
      return null;
    }
    return result.stdout.trim()
  //  result.on("error", (err:Error)=> {
  //       // Only exit with an error if we have critical npm errors for 2nd level inside
  //       const errors = _.split(err.name, '\n');
  //       const failed = _.reduce(
  //         errors,
  //         (failed, error) => {
  //           if (failed) {
  //             return true;
  //           }
  //           return (
  //             !_.isEmpty(error) &&
  //             !_.some(ignoredYarnErrors, (ignoredError) =>
  //               _.startsWith(error, `npm ERR! ${ignoredError.npmError}`)
  //             )
  //           );
  //         },
  //         false
  //       );

  //       if (!failed && !_.isEmpty(err.stack)) {
  //         return Promise.resolve({ stdout: err.message });
  //       }
  //     return result;
  //   })

  //   return result.stdout.read();
  }

  static rebaseLockfile(pathToPackageRoot, lockfile) {
    const fileVersionMatcher = /[^"/]@(?:file:)?((?:\.\/|\.\.\/).*?)[":,]/gm;
    const replacements = [];
    let match;

    // Detect all references and create replacement line strings
    while ((match = fileVersionMatcher.exec(lockfile)) !== null) {
      replacements.push({
        oldRef: match[1],
        newRef: _.replace(`${pathToPackageRoot}/${match[1]}`, /\\/g, '/'),
      });
    }

    // Replace all lines in lockfile
    return _.reduce(
      replacements,
      (__, replacement) => {
        return _.replace(__, replacement.oldRef, replacement.newRef);
      },
      lockfile
    );
  }

  static async install(cwd, packagerOptions) {
    const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
    let args = `install --no-lockfile --non-interactive`;

    // Convert supported packagerOptions
    if (packagerOptions.ignoreScripts) {
      args = `${args} --ignore-scripts`;
    }

    return await execAsync(`${command} ${args}`, { cwd });
  }

  // "Yarn install" prunes automatically
  static prune(cwd, packagerOptions) {
    return Yarn.install(cwd, packagerOptions);
  }

  static async runScripts(cwd, scriptNames) {
    const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
    return map(scriptNames, async (scriptName) => {
      const args = `run ${scriptName}`;
      await execAsync(`${command} ${args}`, { cwd });
    });
  }
}


