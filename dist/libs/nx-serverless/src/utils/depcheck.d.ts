import * as depcheck from 'depcheck';
import { BuilderContext } from '@angular-devkit/architect';
import { DependencyResolver } from './types';
import { Observable } from 'rxjs';
export declare class DependencyCheckResolver implements DependencyResolver {
    private context;
    options: {
        ignoreBinPackage: boolean;
        skipMissing: boolean;
        ignoreDirs: string[];
        ignoreMatches: string[];
        parsers: {};
        detectors: depcheck.Detector[];
        specials: depcheck.Parser[];
        package: {};
    };
    constructor(context: BuilderContext);
    normalizeExternalDependencies(packageJson: any, originPackageJsonPath: string, verbose: boolean, webpackStats?: any, dependencyGraph?: any, sourceRoot?: string, tsconfig?: string): Observable<string[]>;
    dependencyCheck(packageJson: any, sourceRoot: string, tsconfig: string): Observable<depcheck.Results>;
}
