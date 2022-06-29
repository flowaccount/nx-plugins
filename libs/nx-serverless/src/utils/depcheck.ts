import * as depcheck from 'depcheck';
import { DependencyResolver } from './types';
import { getProdModules } from './normalize';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExecutorContext, logger, readJsonFile } from '@nrwl/devkit';
import { StatsCompilation } from 'webpack';
// import { Stats } from 'webpack';
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
    parsers: {},
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
    package: {},
  };
  constructor(private context: ExecutorContext) {}

  normalizeExternalDependencies(
    packageJson: any,
    originPackageJsonPath: string,
    verbose: boolean,
    webpackStats?: StatsCompilation,
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
        if (Object.keys(result.invalidFiles).length > 0) {
          throw result.invalidFiles;
        }
        Object.keys(result.missing).forEach((key) => {
          logger.warn(`Missing dependencies ${key} in ${result.missing[key]}`);
        });
        Object.keys(result.using).forEach((key) => {
          externals.push({
            origin: result.using[key],
            external: key,
          });
        });
        // TODO: issue #48
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
    logger.info(`checking depedencies in depcheck.dependencyCheck ${tsconfig}`)
    const tsconfigJson = readJsonFile(tsconfig);
    const parsers = {};
    if (tsconfigJson.files) {
      tsconfigJson.files.forEach((fileName) => {
        parsers[fileName] = depcheck.parser.typescript;
      });
    }
    if (tsconfigJson.include) {
      tsconfigJson.include.forEach((includePattern) => {
        parsers[includePattern] = depcheck.parser.typescript;
      });
    }
    this.options.parsers = parsers;
    this.options.package = packageJson;


    return from(depcheck(sourceRoot, this.options));
  }
}
