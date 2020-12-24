"use strict";
/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const child_process_1 = require("child_process");
const operators_1 = require("rxjs/operators");
class Yarn {
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
    static generateLockFile(cwd) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        const args = ['generate-lock-entry'];
        return child_process_1.spawnSync(command, args, {
            cwd: cwd
        });
    }
    static getProdDependencies(cwd, depth) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        const args = ['list', `--depth=${depth || 1}`, '--json', '--production'];
        // If we need to ignore some errors add them here
        const ignoredYarnErrors = [];
        var result = child_process_1.spawnSync(command, args, {
            cwd: cwd
        });
        if (result.error) {
            const err = result.error;
            if (err instanceof Error) {
                // Only exit with an error if we have critical npm errors for 2nd level inside
                const errors = _.split(err.name, '\n');
                const failed = _.reduce(errors, (failed, error) => {
                    if (failed) {
                        return true;
                    }
                    return (!_.isEmpty(error) &&
                        !_.some(ignoredYarnErrors, ignoredError => _.startsWith(error, `npm ERR! ${ignoredError.npmError}`)));
                }, false);
                if (!failed && !_.isEmpty(err.stack)) {
                    return Promise.resolve({ stdout: err.message });
                }
            }
            return result;
        }
        else {
            return result;
        }
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
        const args = ['install', '--no-lockfile', '--non-interactive'];
        // Convert supported packagerOptions
        if (packagerOptions.ignoreScripts) {
            args.push('--ignore-scripts');
        }
        return child_process_1.spawnSync(command, args, { cwd });
    }
    // "Yarn install" prunes automatically
    static prune(cwd, packagerOptions) {
        return Yarn.install(cwd, packagerOptions);
    }
    static runScripts(cwd, scriptNames) {
        const command = /^win/.test(process.platform) ? 'yarn.cmd' : 'yarn';
        return operators_1.map(scriptNames, scriptName => {
            const args = ['run', scriptName];
            return child_process_1.spawn(command, args, { cwd });
        });
    }
}
exports.Yarn = Yarn;
//# sourceMappingURL=yarn.js.map