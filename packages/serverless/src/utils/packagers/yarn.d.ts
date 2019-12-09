/**
 * Yarn packager.
 *
 * Yarn specific packagerOptions (default):
 *   flat (false) - Use --flat with install
 *   ignoreScripts (false) - Do not execute scripts during install
 */
/// <reference types="node" />
export declare class Yarn {
    static readonly lockfileName: string;
    static readonly copyPackageSectionNames: string[];
    static readonly mustCopyModules: boolean;
    static getProdDependencies(cwd: any, depth: any): import("child_process").ChildProcess;
    static rebaseLockfile(pathToPackageRoot: any, lockfile: any): any;
    static install(cwd: any, packagerOptions: any): import("child_process").ChildProcess;
    static prune(cwd: any, packagerOptions: any): import("child_process").ChildProcess;
    static runScripts(cwd: any, scriptNames: any): import("rxjs").OperatorFunction<unknown, unknown>;
}
