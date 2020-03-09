import * as depcheck from 'depcheck';
import { DependencyResolver } from './types';

export class DependencyCheckResolver implements DependencyResolver {
  options = {
    ignoreBinPackage: false, // ignore the packages with bin entry
    skipMissing: false, // skip calculation of missing dependencies
    ignoreDirs: [
      // folder with these names will be ignored
      'sandbox',
      'dist',
      'bower_components',
    ],
    ignoreMatches: [
      // ignore dependencies that matches these globs
      'grunt-*',
    ],
    parsers: {
      // the target parsers
      'handler.ts': depcheck.parser.es6
    },
    detectors: [
      // the target detectors
      depcheck.detector.requireCallExpression,
      depcheck.detector.importDeclaration,
    ],
    specials: [
      // the target special parsers
      depcheck.special.eslint,
      depcheck.special.webpack,
    ],
    package: {}
  };
  constructor() {
  }

  normalizeExternalDependencies(packageJson: any, originPackageJsonPath: string, verbose: boolean, webpackStats?: any, dependencyGraph?: any, sourceRoot?: string) {
    const externals = this.dependencyCheck(packageJson, sourceRoot);
    if (!dependencyGraph || dependencyGraph === null) {
      dependencyGraph = {};
    }
    return [];
    // const prodModules = this.getProdModules(externals, packageJson, originPackageJsonPath, [], dependencyGraph, verbose);
    // return prodModules;
  }

  async dependencyCheck(packageJson: any, sourceRoot: string): Promise<depcheck.Results> {
    this.options.package = packageJson;
    return await depcheck(sourceRoot, this.options);
  }
}