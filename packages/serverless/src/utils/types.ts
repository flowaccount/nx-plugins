import { Path } from '@angular-devkit/core';

export interface FileReplacement {
    replace: string;
    with: string;
}
export interface SourceMapOptions {
    scripts: boolean;
    styles: boolean;
    vendors: boolean;
    hidden: boolean;
  }
  export interface OptimizationOptions {
    scripts: boolean;
    styles: boolean;
  }

export interface BuildBuilderOptions {
    package: string;
    region?: string;
    state?: string;
    serverlessConfig: string;
    servicePath: string;
    tsConfig: string;
    outputPath: string;
    showCircularDependencies?: boolean;
    poll?: number;
    fileReplacements: FileReplacement[];
    webpackConfig?: string;
    root?: string;
    sourceRoot?: Path;
    entry?: {};
    readyWhen?: string;
    progress?: boolean;
    watch?: boolean;
    assets? : any[];
    maxWorkers?: number;
    extractLicenses?: boolean;
    verbose?: boolean;
    statsJson?: boolean;
    optimization?: boolean;
    sourceMap?: boolean;
    externalDependencies: 'all' | 'none' | string[];
    processEnvironmentFile: 'env.json' | 'string';
    logGroupName?: string;
  }