import { Path } from '@angular-devkit/core';
// import { JsonObject } from '@angular-devkit/core';
import { Stats } from 'webpack';
import { Observable } from 'rxjs';
import { Target } from '@nrwl/devkit';

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

export type FileInputOutput = {
  input: string;
  output: string;
};
export type AssetGlob = FileInputOutput & {
  glob: string;
  ignore: string[];
};

export interface ServerlessBaseOptions {
  serverlessConfig: string;
  servicePath: string;
  processEnvironmentFile: 'env.json' | 'string';
  tsConfig: string;
  package: string;
  outputPath: string;
  logGroupName?: string;
  region?: string;
  state?: string;
  assets?: Array<AssetGlob | string>;
  fileReplacements?: Array<{
    replace: string;
    with: string;
  }>;
  webpackConfig?: string | string[];
  watch?: boolean;
  sourceMap?: boolean;
  files?: {};
  assetFiles?: Array<FileInputOutput>;
  sourceRoot?: Path;
}

export interface ServerlessCompileOptions extends ServerlessBaseOptions {
  skipClean: boolean;
}

export interface BuildBuilderOptions extends ServerlessBaseOptions {
  showCircularDependencies?: boolean;
  poll?: number;
  root?: string;
  entry?: {};
  readyWhen?: string;
  progress?: boolean;
  maxWorkers?: number;
  extractLicenses?: boolean;
  verbose?: boolean;
  statsJson?: boolean;
  optimization?: boolean;
  externalDependencies: 'all' | 'none' | string[];
}

export interface NormalizedBuildServerlessBuilderOptions
  extends BuildBuilderOptions {
  webpackConfig: string[];
}

type normalizeExternalDependencies = (
  packageJson: any,
  originPackageJsonPath: string,
  verbose: boolean,
  webpackStats?: Stats.ToJsonOutput,
  dependencyGraph?: any,
  sourceRoot?: string,
  tsconfig?: string
) => Observable<Array<string>>;

export interface DependencyResolver {
  normalizeExternalDependencies: normalizeExternalDependencies;
}

export interface ServerlessEventResult {
  resolverName: string;
  tsconfig: string;
}

export interface ServerlessBuildEvent {
  error?: string;
  info?: {
    [key: string]: any;
  };
  success: boolean;
  target?: Target;
}
