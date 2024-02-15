import isBuiltinModule = require('is-builtin-module');
import * as _ from 'lodash';
import { DependencyResolver } from './types';
import { getProdModules } from './normalize';
import { of } from 'rxjs';
import { ExecutorContext } from '@nx/devkit';
import { StatsCompilation } from 'webpack';

export class WebpackDependencyResolver implements DependencyResolver {
  constructor(private context: ExecutorContext) {}

  async normalizeExternalDependencies(
    packageJson: any,
    originPackageJsonPath: string,
    verbose: boolean,
    webpackStats?: StatsCompilation,
    dependencyGraph?: any,
    sourceRoot?: string,
    tsconfig?: string
  ) {
    const externals = this.getExternalModules(webpackStats);
    if (!dependencyGraph || dependencyGraph === null) {
      dependencyGraph = {};
    }
    // TODO: issue #48
    const prodModules = getProdModules(
      externals,
      packageJson,
      originPackageJsonPath,
      [],
      dependencyGraph,
      verbose
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
    // console.log('----------------------------------------------------------------')
    // console.log(module.identifier)
    // console.log('----------------------------------------------------------------')
    // console.log(/"(.*)"$/.exec(module.identifier))
    // console.log('----------------------------------------------------------------')
    const path = /"(.*)"$/.exec(module.identifier)[1];
    // console.log('----------------------------------------------------------------')
    // console.log(path)
    // console.log('----------------------------------------------------------------')
    // const path = (/^external "(.*)"$/.exec(module.identifier)) != null && (/^external "(.*)"$/.exec(module.identifier)).length > 0 ? /^external "(.*)"$/.exec(module.identifier)[1] : module.identifier
    const pathComponents = path.split('/');
    const main = pathComponents[0];

    // this is a package within a namespace
    if (main.charAt(0) == '@') {
      return `${main}/${pathComponents[1]}`;
    }
    // console.log('----------------------------------------------------------------')
    // console.log(main)
    // console.log('----------------------------------------------------------------')
    return main;
  }

  getExternalModules(stats: StatsCompilation) {
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
            external: this.getExternalModuleName(module),
          });
        }
      }
    }
    return Array.from(externals);
  }
}
