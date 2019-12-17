"use strict";
/**
 * Factory for supported packagers.
 *
 * All packagers must implement the following interface:
 *
 * interface Packager {
 *
 * static get lockfileName(): string;
 * static get copyPackageSectionNames(): Array<string>;
 * static get mustCopyModules(): boolean;
 * static getProdDependencies(cwd: string, depth: number = 1): BbPromise<Object>;
 * static rebaseLockfile(pathToPackageRoot: string, lockfile: Object): void;
 * static install(cwd: string): BbPromise<void>;
 * static prune(cwd: string): BbPromise<void>;
 * static runScripts(cwd: string, scriptNames): BbPromise<void>;
 *
 * }
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const npm_1 = require("./npm");
const yarn_1 = require("./yarn");
const serverless_1 = require("../../utils/serverless");
const registeredPackagers = {
    npm: npm_1.NPM,
    yarn: yarn_1.Yarn
};
/**
 * Factory method.
 * @this ServerlessWebpack - Active plugin instance
 * @param {string} packagerId - Well known packager id.
 */
function packager(packagerId) {
    if (!_.has(registeredPackagers, packagerId)) {
        const message = `Could not find packager '${packagerId}'`;
        serverless_1.ServerlessWrapper.serverless.cli.log(`ERROR: ${message}`);
        throw new serverless_1.ServerlessWrapper.serverless.classes.Error(message);
    }
    return registeredPackagers[packagerId];
}
exports.packager = packager;
;
