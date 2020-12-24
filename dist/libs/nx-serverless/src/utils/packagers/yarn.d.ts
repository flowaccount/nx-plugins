/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */
/// <reference types="node" />
export declare class Yarn {
    static get lockfileName(): string;
    static get copyPackageSectionNames(): string[];
    static get mustCopyModules(): boolean;
    static generateLockFile(cwd: any): import("child_process").SpawnSyncReturns<Buffer>;
    static getProdDependencies(cwd: any, depth: any): import("child_process").SpawnSyncReturns<Buffer> | Promise<{
        stdout: string;
    }>;
    static rebaseLockfile(pathToPackageRoot: any, lockfile: any): any;
    static install(cwd: any, packagerOptions: any): import("child_process").SpawnSyncReturns<Buffer>;
    static prune(cwd: any, packagerOptions: any): import("child_process").SpawnSyncReturns<Buffer>;
    static runScripts(cwd: any, scriptNames: any): import("rxjs").OperatorFunction<unknown, unknown>;
}
