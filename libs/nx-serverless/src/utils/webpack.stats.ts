
import * as isBuiltinModule from 'is-builtin-module';
import * as _ from 'lodash';
import { join, dirname } from 'path';
import { ServerlessWrapper } from './serverless';
import { DependencyResolver } from './types';

export class WebpackDependencyResolver implements DependencyResolver {

  constructor() {
  }

  normalizeExternalDependencies(packageJson: any, originPackageJsonPath: string, verbose: boolean, webpackStats?: any, dependencyGraph?: any, sourceRoot?: string) {
    const externals = this.getExternalModules(webpackStats);
    if (!dependencyGraph || dependencyGraph === null) {
      dependencyGraph = {};
    }
    const prodModules = this.getProdModules(externals, packageJson, originPackageJsonPath, [], dependencyGraph, verbose);
    return prodModules;
  }

  isExternalModule(module) {
    return _.startsWith(module.identifier, 'external ') && !isBuiltinModule(this.getExternalModuleName(module));
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

  getProdModules(externalModules, packageJson, packagePath, forceExcludes, dependencyGraph, verbose = false): string[] {
    const prodModules = [];
    // only process the module stated in dependencies section
    if (!packageJson.dependencies) {
      return [];
    }
    console.log(externalModules)
    // Get versions of all transient modules
    _.forEach(externalModules, module => {
      let moduleVersion = packageJson.dependencies[module.external];
      if (moduleVersion) {
        prodModules.push(`${module.external}@${moduleVersion}`);
        // Check if the module has any peer dependencies and include them too
        try {
          const modulePackagePath = join(
            dirname(join(process.cwd(), packagePath)),
            'node_modules',
            module.external,
            'package.json'
          );
          const peerDependencies = require(modulePackagePath).peerDependencies;
          if (!_.isEmpty(peerDependencies)) {
            verbose && ServerlessWrapper.serverless.cli.log(`Adding explicit peers for dependency ${module.external}`);
            const peerModules = this.getProdModules.call(this, _.map(peerDependencies, (value, key) => ({ external: key })), packagePath, dependencyGraph, forceExcludes);
            Array.prototype.push.apply(prodModules, peerModules);
          }
        } catch (e) {
          ServerlessWrapper.serverless.cli.log(`WARNING: Could not check for peer dependencies of ${module.external}`);
        }
      } else {
        if (!packageJson.devDependencies || !packageJson.devDependencies[module.external] && dependencyGraph.dependencies) {
          // Add transient dependencies if they appear not in the service's dev dependencies

          const originInfo = _.get(dependencyGraph, 'dependencies', {})[module.external] || {};
          moduleVersion = _.get(originInfo, 'version', null);
          if (!moduleVersion) {
            ServerlessWrapper.serverless.cli.log(`WARNING: Could not determine version of module ${module.external}`);
          }
          prodModules.push(moduleVersion ? `${module.external}@${moduleVersion}` : module.external);
        } else if (packageJson.devDependencies && packageJson.devDependencies[module.external] && !_.includes(forceExcludes, module.external)) {
          // To minimize the chance of breaking setups we whitelist packages available on AWS here. These are due to the previously missing check
          // most likely set in devDependencies and should not lead to an error now.
          const ignoredDevDependencies = ['aws-sdk'];
          if (!_.includes(ignoredDevDependencies, module.external)) {
            // Runtime dependency found in devDependencies but not forcefully excluded
            ServerlessWrapper.serverless.cli.log(`ERROR: Runtime dependency '${module.external}' found in devDependencies. Move it to dependencies or use forceExclude to explicitly exclude it.`);
            throw new ServerlessWrapper.serverless.classes.Error(`Serverless-webpack dependency error: ${module.external}.`);
          }
          verbose && ServerlessWrapper.serverless.cli.log(`INFO: Runtime dependency '${module.external}' found in devDependencies. It has been excluded automatically.`);
        }
      }
    });
    return prodModules;
  }
}
