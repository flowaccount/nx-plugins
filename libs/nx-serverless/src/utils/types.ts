import { StatsCompilation } from 'webpack';
import { Observable } from 'rxjs';
import { Target } from '@nx/devkit';
import { Packager } from './enums';

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
  sourceRoot?: string;
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
  webpackStats?: StatsCompilation,
  dependencyGraph?: any,
  sourceRoot?: string,
  tsconfig?: string
) => Promise<Array<string>>;

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

export interface SimpleBuildEvent {
  error?: string;
  success: boolean;
  target?: Target;
  outfile?: string;
  webpackStats?: StatsCompilation;
  resolverName?: string;
  tsconfig?: string;
}

export const enum InspectType {
  Inspect = 'inspect',
  InspectBrk = 'inspect-brk',
}

// review: Have to spin off options and clarify schema.json for deploy,build,serve
export interface ServerlessDeployBuilderOptions {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  host: string;
  port: number;
  watch: boolean;
  package: string;
  location: string;
  stage: string;
  list: boolean;
  updateConfig: boolean;
  function?: string;
  verbose?: boolean;
  sourceRoot?: string;
  root?: string;
  ignoreScripts: boolean;
  packager?: Packager;
  serverlessPackagePath?: string;
  args?: string;
  skipBuild?: boolean;
  processEnvironmentFile?: string;
}

export interface ServerlessSlsBuilderOptions {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  host: string;
  port: number;
  watch: boolean;
  package: string;
  location: string;
  stage: string;
  verbose?: boolean;
  sourceRoot?: string;
  root?: string;
  command: string;
  ignoreScripts: boolean;
  packager?: Packager;
  serverlessPackagePath?: string;
  args?: string;
}

// https://www.npmjs.com/package/serverless-offline
export interface ServerlessExecutorOptions {
  inspect: boolean | InspectType;
  waitUntilTargets: string[];
  buildTarget: string;
  watch: boolean;
  args: string[];
  runtimeArgs: string[];
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
  skipBuild?: boolean;
  config: string;
  package?: string;
  processEnvironmentFile?: string;
}
