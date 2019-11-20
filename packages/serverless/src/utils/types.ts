import { Path } from '@angular-devkit/core';

export interface FileReplacement {
    replace: string;
    with: string;
}

// https://www.npmjs.com/package/serverless-offline
export interface ServerlessOfflineOptions {
    verbose?: boolean;
    binPath?: string;
    host?: string;
    location?: string;
    noAuth?: boolean;
    noEnvironment?: boolean;
    port?: number;
    region?: string;
    printOutput?: boolean;
    preserveTrailingSlash?: boolean;
    stage?: string;
    useSeparateProcesses?: boolean;
    websocketPort?: number;
    prefix?: string;
    hideStackTraces?: boolean;
    corsAllowHeaders?: string;
    corsAllowOrigin?: string;
    corsDisallowCredentials?: string;
    corsExposedHeaders?: string;
    disableCookieValidation?: boolean;
    enforceSecureCookies?: boolean;
    exec?: string;
    readyWhen: string;
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
    tsConfig: string;
    outputPath: string;
    optimization?: boolean  | OptimizationOptions;
    showCircularDependencies?: boolean;
    poll?: number;
    fileReplacements: FileReplacement[];
    webpackConfig?: string;
    root?: string;
    sourceRoot?: Path;
    readyWhen?: string;
    arguments: ServerlessOfflineOptions;
    progress?: boolean;
    watch?: boolean;
    maxWorkers?: number;
    extractLicenses?: boolean;
    verbose?: boolean;
    statsJson?: boolean;
    sourceMap?: boolean | SourceMapOptions;
  }