import { BuilderContext } from '@angular-devkit/architect';
import { ServerlessBaseOptions } from './types';
export interface FileReplacement {
    replace: string;
    with: string;
}
export declare function assignEntriesToFunctionsFromServerless<T extends ServerlessBaseOptions>(options: T, root: string): T;
export declare function getProjectRoot(context: BuilderContext): Promise<string>;
export declare function getSourceRoot(context: BuilderContext): Promise<string>;
export declare function normalizeBuildOptions<T extends ServerlessBaseOptions>(options: T, root: string, sourceRoot: string): T;
export declare const getEntryForFunction: (name: any, serverlessFunction: any, serverless: any, sourceroot: any, root: any) => {
    [x: string]: string;
};
export declare function getProdModules(externalModules: any, packageJson: any, packagePath: any, forceExcludes: any, dependencyGraph: any, verbose?: boolean): string[];
