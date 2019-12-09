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

import * as _ from 'lodash';
import { NPM } from './npm';
import { Yarn } from './yarn';
import { ServerlessWrapper } from '../../utils/serverless';

const registeredPackagers = {
  npm: NPM,
  yarn: Yarn
};

/**
 * Factory method.
 * @this ServerlessWebpack - Active plugin instance
 * @param {string} packagerId - Well known packager id.
 */
export function packager(packagerId) {
  if (!_.has(registeredPackagers, packagerId)) {
    const message = `Could not find packager '${packagerId}'`;
    ServerlessWrapper.serverless.cli.log(`ERROR: ${message}`);
    throw new ServerlessWrapper.serverless.classes.Error(message);
  }
  return registeredPackagers[packagerId];
};
