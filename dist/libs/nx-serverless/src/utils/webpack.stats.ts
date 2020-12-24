import * as isBuiltinModule from 'is-builtin-module';
import * as _ from 'lodash';
import { DependencyResolver } from './types';
import { getProdModules } from './normalize';
import { of } from 'rxjs';
import { BuilderContext } from '@angular-devkit/architect';

export class WebpackDependencyResolver implements DependencyResolver {
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
    const externals = this.getExternalModules(webpackStats);
    if (!dependencyGraph || dependencyGraph === null) {
      dependencyGraph = {};
    }
    const prodModules = of(
      getProdModules(
        externals,
        packageJson,
        originPackageJsonPath,
        [],
        dependencyGraph,
        verbose
      )
    );
    return prodModules;
  }

  isExternalModule(module) {
    return (
      _.startsWith(module.identifier, 'external ') &&
      !isBuiltinModule(this.getExternalModuleName(module))
    );
  }

  getExternalModuleName(module) {
    const path = /^external "(.*)"$/.exec(module.identifier)[1];
    const pathComponents = path.split('/');
    const main = pathComponents[0];

    // this is a package within a namespace
    if (main.charAt(0) == '@') {
      return `${main}/${pathComponents[1]}`;
    }
    return main;
  }

  getExternalModules(stats: any) {
    if (!stats.chunks) {
      return [];
    }
    const externals = new Set();
    for (const chunk of stats.chunks) {
      if (!chunk.modules) {
        continue;
      }

      // Explore each module within the chunk (built inputs):
      for (const module of chunk.modules) {
        if (this.isExternalModule(module)) {
          externals.add({
            origin: module.issuer,
            external: this.getExternalModuleName(module)
          });
        }
      }
    }
    return Array.from(externals);
  }
}
