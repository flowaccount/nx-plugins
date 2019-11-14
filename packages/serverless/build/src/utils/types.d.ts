import { Path } from '@angular-devkit/core';
export interface FileReplacement {
    replace: string;
    with: string;
}
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
}
export interface BuildBuilderOptions {
    package: string;
    region?: string;
    state?: string;
    serverlessConfig: string;
    tsConfig: string;
    optimization?: boolean;
    showCircularDependencies?: boolean;
    poll?: number;
    fileReplacements: FileReplacement[];
    progress?: boolean;
    webpackConfig?: string;
    root?: string;
    sourceRoot?: Path;
    readyWhen?: string;
    arguments: ServerlessOfflineOptions;
}
