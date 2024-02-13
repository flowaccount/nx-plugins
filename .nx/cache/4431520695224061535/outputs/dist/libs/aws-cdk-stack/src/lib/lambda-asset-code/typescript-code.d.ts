import { Construct } from 'constructs';
import { Code, AssetCode } from 'aws-cdk-lib/aws-lambda';
interface CopyFileItem {
    sourcePath: string;
    targetPath: string;
}
export interface TypeScriptAssetCodeOptions {
    npmInstallCommand?: string;
    npmInstallArguments?: string[];
    copyFiles?: CopyFileItem[];
}
/**
 * Wrapper for the Code abstract class, which provides some static helper methods.
 */
export declare abstract class TypeScriptCode extends Code {
    static asset(path: string, distPath?: string, options?: TypeScriptAssetCodeOptions): TypeScriptAssetCode;
}
/**
 * Extension for AssetCode to run a TypeScript build step before deployment.
 */
export declare class TypeScriptAssetCode extends AssetCode {
    private originalSourcePath;
    private typeScriptSourcePath;
    private typeScriptAssetCodeOptions;
    constructor(path: string, distPath?: string, options?: TypeScriptAssetCodeOptions);
    bind(construct: Construct): import("aws-cdk-lib/aws-lambda").CodeConfig;
    private typeScriptBuild;
}
export {};
