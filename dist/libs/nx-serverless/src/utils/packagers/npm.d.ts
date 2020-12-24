/// <reference types="node" />
export declare class NPM {
    static get lockfileName(): string;
    static get copyPackageSectionNames(): any[];
    static get mustCopyModules(): boolean;
    static getProdDependencies(cwd: any, depth: any): import("child_process").SpawnSyncReturns<Buffer> | Promise<{
        stdout: string;
    }>;
    static _rebaseFileReferences(pathToPackageRoot: any, moduleVersion: any): any;
    /**
     * We should not be modifying 'package-lock.json'
     * because this file should be treated as internal to npm.
     *
     * Rebase package-lock is a temporary workaround and must be
     * removed as soon as https://github.com/npm/npm/issues/19183 gets fixed.
     */
    static rebaseLockfile(pathToPackageRoot: any, lockfile: any): any;
    static install(cwd: any): import("child_process").SpawnSyncReturns<Buffer>;
    static prune(cwd: any): import("child_process").ChildProcess;
    static runScripts(cwd: any, scriptNames: any): import("rxjs").OperatorFunction<unknown, unknown>;
}
