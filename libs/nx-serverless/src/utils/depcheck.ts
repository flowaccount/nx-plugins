import * as depcheck from 'depcheck';
import { BuilderContext } from '@angular-devkit/architect';
import { readJsonFile } from '@nrwl/workspace';
import { DependencyResolver } from './types';
import { getProdModules } from './normalize';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export class DependencyCheckResolver implements DependencyResolver {
  options = {
    ignoreBinPackage: false, // ignore the packages with bin entry
    skipMissing: false, // skip calculation of missing dependencies
    ignoreDirs: [
      // folder with these names will be ignored
      'sandbox',
      'dist',
      'bower_components'
    ],
    ignoreMatches: [
      // ignore dependencies that matches these globs
      'grunt-*'
    ],
    parsers: {},
    detectors: [
      // the target detectors
      depcheck.detector.requireCallExpression,
      depcheck.detector.importDeclaration
    ],
    specials: [
      // the target special parsers
      depcheck.special.eslint,
      depcheck.special.webpack
    ],
    package: {}
  };
  constructor(private context: BuilderContext) {}

  normalizeExternalDependencies(
    packageJson: any,
    originPackageJsonPath: string,
    verbose: boolean,
    webpackStats?: any,
    dependencyGraph?: any,
    sourceRoot?: string,
    tsconfig?: string
  ) {
    return this.dependencyCheck(packageJson, sourceRoot, tsconfig).pipe(
      map((result: depcheck.Results) => {
        if (!dependencyGraph || dependencyGraph === null) {
          dependencyGraph = {};
        }
        const externals = [];
        Object.keys(result.missing).forEach(key => {
          this.context.logger.warn(
            `Missing dependencies ${key} in ${result.missing[key]}`
          );
        });
        Object.keys(result.using).forEach(key => {
          externals.push({
            origin: result.using[key],
            external: key
          });
        });
        return getProdModules(
          externals,
          packageJson,
          originPackageJsonPath,
          [],
          dependencyGraph,
          verbose
        );
      })
    );
  }
  dependencyCheck(
    packageJson: any,
    sourceRoot: string,
    tsconfig: string
  ): Observable<depcheck.Results> {
    const tsconfigJson = readJsonFile(tsconfig);
    const parsers = {};
    if (tsconfigJson.files) {
      tsconfigJson.files.forEach(fileName => {
        parsers[fileName] = depcheck.parser.es6;
      });
    }
    if (tsconfigJson.include) {
      tsconfigJson.include.forEach(includePattern => {
        parsers[includePattern] = depcheck.parser.es6;
      });
    }
    this.options.parsers = parsers;
    this.options.package = packageJson;
    return from(depcheck(sourceRoot, this.options));
  }
}
