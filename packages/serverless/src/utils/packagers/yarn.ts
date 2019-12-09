/**
 * Yarn packager.
 * 
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */

import * as _ from 'lodash';
import {  spawn } from 'child_process';
import { from } from 'rxjs/internal/observable/from';
import { map } from 'rxjs/operators';

export class Yarn {
  static get lockfileName() {  // eslint-disable-line lodash/prefer-constant
    return 'yarn.lock';
  }

  static get copyPackageSectionNames() {
    return ['resolutions'];
  }

  static get mustCopyModules() {  // eslint-disable-line lodash/prefer-constant
    return false;
  }

  static getProdDependencies(cwd, depth) {
    const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
    const args = [
      'list',
      `--depth=${depth || 1}`,
      '--json',
      '--production'
    ];

    // If we need to ignore some errors add them here
    const ignoredYarnErrors = [];

    return spawn(command, args, {
      cwd: cwd
    }).on('error', err  => {
      if (err instanceof Error) {
        // Only exit with an error if we have critical npm errors for 2nd level inside
        const errors = _.split(err.name, '\n');
        const failed = _.reduce(errors, (failed, error) => {
          if (failed) {
            return true;
          }
          return !_.isEmpty(error) && !_.some(ignoredYarnErrors, ignoredError => _.startsWith(error, `npm ERR! ${ignoredError.npmError}`));
        }, false);

        if (!failed && !_.isEmpty(err.stack)) {
          return Promise.resolve({ stdout: err.message });
        }
      }

      return Promise.reject(err);
    })
    // .then(processOutput => processOutput.stdout)
    // .then(depJson => from(() => JSON.parse(depJson)))
    // .then(parsedTree => {
    //   const convertTrees = trees => _.reduce(trees, (__, tree) => {
    //     const splitModule = _.split(tree.name, '@');
    //     // If we have a scoped module we have to re-add the @
    //     if (_.startsWith(tree.name, '@')) {
    //       splitModule.splice(0, 1);
    //       splitModule[0] = '@' + splitModule[0];
    //     }
    //     __[_.first(splitModule)] = {
    //       version: _.join(_.tail(splitModule), '@'),
    //       dependencies: convertTrees(tree.children)
    //     };
    //     return __;
    //   }, {});

    //   const trees = _.get(parsedTree, 'data.trees', []);
    //   const result = {
    //     problems: [],
    //     dependencies: convertTrees(trees) 
    //   };
    //   return result;
    // });
  }

  static rebaseLockfile(pathToPackageRoot, lockfile) {
    const fileVersionMatcher = /[^"/]@(?:file:)?((?:\.\/|\.\.\/).*?)[":,]/gm;
    const replacements = [];
    let match;
    
    // Detect all references and create replacement line strings
    while ((match = fileVersionMatcher.exec(lockfile)) !== null) {
      replacements.push({
        oldRef: match[1],
        newRef: _.replace(`${pathToPackageRoot}/${match[1]}`, /\\/g, '/')
      });
    }

    // Replace all lines in lockfile
    return _.reduce(replacements, (__, replacement) => {
      return _.replace(__, replacement.oldRef, replacement.newRef);
    }, lockfile);
  }

  static install(cwd, packagerOptions) {
    const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
    const args = [
      'install',
      '--frozen-lockfile',
      '--non-interactive'
    ];

    // Convert supported packagerOptions
    if (packagerOptions.ignoreScripts) {
      args.push('--ignore-scripts');
    }

    return spawn(command, args, { cwd })
  }

  // "Yarn install" prunes automatically
  static prune(cwd, packagerOptions) {
    return Yarn.install(cwd, packagerOptions);
  }

  static runScripts(cwd, scriptNames) {
    const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
    return map(scriptNames, scriptName => {
      const args = [
        'run',
        scriptName
      ];

      return spawn(command, args, { cwd });
    })
  }
}
