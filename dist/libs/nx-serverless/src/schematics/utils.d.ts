import { Path } from '@angular-devkit/core';
export interface BaseSchema {
    appProjectRoot: Path;
    provider: string;
    region: string;
    endpointType: string;
    skipFormat: boolean;
}
export declare function getBuildConfig(options: BaseSchema): {
    builder: string;
    options: {
        outputPath: Path;
        package: Path;
        serverlessConfig: Path;
        servicePath: Path;
        tsConfig: Path;
        provider: string;
        processEnvironmentFile: string;
    };
    configurations: {
        dev: {
            optimization: boolean;
            sourceMap: boolean;
            budgets: {
                type: string;
                maximumWarning: string;
                maximumError: string;
            }[];
        };
        production: {
            optimization: boolean;
            sourceMap: boolean;
            extractCss: boolean;
            namedChunks: boolean;
            extractLicenses: boolean;
            vendorChunk: boolean;
            budgets: {
                type: string;
                maximumWarning: string;
                maximumError: string;
            }[];
            fileReplacements: {
                replace: Path;
                with: Path;
            }[];
        };
    };
};
