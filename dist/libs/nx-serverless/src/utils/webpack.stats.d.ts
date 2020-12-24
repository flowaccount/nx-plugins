import { DependencyResolver } from './types';
import { BuilderContext } from '@angular-devkit/architect';
export declare class WebpackDependencyResolver implements DependencyResolver {
    private context;
    constructor(context: BuilderContext);
    normalizeExternalDependencies(packageJson: any, originPackageJsonPath: string, verbose: boolean, webpackStats?: any, dependencyGraph?: any, sourceRoot?: string, tsconfig?: string): import("rxjs").Observable<string[]>;
    isExternalModule(module: any): boolean;
    getExternalModuleName(module: any): string;
    getExternalModules(stats: any): unknown[];
}
