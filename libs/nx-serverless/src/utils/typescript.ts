// import * as glob from 'glob';
import { BuilderOutput } from '@angular-devkit/architect';
import { Observable, Subscriber } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { unlinkSync } from 'fs';
const treeKill = require('tree-kill');
import { ChildProcess, fork } from 'child_process';
import { ProjectGraphNode } from '@nrwl/workspace/src/core/project-graph';
import { join } from 'path';
import { removeSync } from 'fs-extra';
import { ServerlessCompileOptions } from './types';
import { ExecutorContext, logger } from '@nrwl/devkit';
let tscProcess: ChildProcess;

/**
 * -----------------------------------------------------------
 */

type DependentLibraryNode = {
  scope: string;
  outputPath: string;
  node: ProjectGraphNode;
};

function cleanupTmpTsConfigFile(tsConfigPath) {
  if (tsConfigPath.indexOf('.nx-tmp') > -1) {
    unlinkSync(tsConfigPath);
  }
}

function killProcess(): void {
  return treeKill(tscProcess.pid, 'SIGTERM', (error) => {
    tscProcess = null;
    if (error) {
      if (Array.isArray(error) && error[0] && error[2]) {
        const errorMessage = error[2];
        logger.error(errorMessage);
      } else if (error.message) {
        logger.error(error.message);
      }
    }
  });
}

export function compileTypeScriptFiles(
  options: ServerlessCompileOptions,
  context: ExecutorContext
  // projectDependencies: DependentLibraryNode[]
): Observable<BuilderOutput> {
  if (tscProcess) {
    killProcess();
  }
  // Cleaning the /dist folder
  if (!options.skipClean) {
    removeSync(options.outputPath);
  }
  const tsConfigPath = options.tsConfig;
  return Observable.create((subscriber: Subscriber<BuilderOutput>) => {
    // if (projectDependencies.length > 0) {
    // const parsedTSConfig = readTsConfig(tsConfigPath);
    // const parsedTSConfig = ts.readConfigFile(tsConfigPath, ts.sys.readFile).config;

    //     // update TSConfig paths to point to the dist folder
    //     projectDependencies.forEach(libDep => {
    //         parsedTSConfig.compilerOptions = parsedTSConfig.compilerOptions || {};
    //         parsedTSConfig.compilerOptions.paths =
    //             parsedTSConfig.compilerOptions.paths || {};

    //         const currentPaths =
    //             parsedTSConfig.compilerOptions.paths[libDep.scope] || [];
    //         parsedTSConfig.compilerOptions.paths[libDep.scope] = [
    //             libDep.outputPath,
    //             ...currentPaths
    //         ];
    //     });
    //     // find the library root folder
    //     const projGraph = createProjectGraph();
    //     const libRoot = projGraph.nodes[context.target.project].data.root;

    //     // write the tmp tsconfig needed for building
    //     const tmpTsConfigPath = join(
    //         context.workspaceRoot,
    //         libRoot,
    //         'tsconfig.lib.nx-tmp'
    //     );
    //     writeJsonFile(tmpTsConfigPath, parsedTSConfig);

    //     // adjust the tsConfig path s.t. it points to the temporary one
    //     // with the adjusted paths
    //     tsConfigPath = tmpTsConfigPath;
    // }

    try {
      const args = ['-p', tsConfigPath, '--outDir', options.outputPath];
      if (options.sourceMap) {
        args.push('--sourceMap');
      }

      const tscPath = join(context.root, '/node_modules/typescript/bin/tsc');
      if (options.watch) {
        logger.info('Starting TypeScript watch');
        args.push('--watch');
        tscProcess = fork(tscPath, args, { stdio: [0, 1, 2, 'ipc'] });
        subscriber.next({ success: true });
      } else {
        logger.info(
          `Compiling TypeScript files for tsconfig ${tsConfigPath} under ${context.projectName} ${context.targetName}...`
        );
        tscProcess = fork(tscPath, args, { stdio: [0, 1, 2, 'ipc'] });
        tscProcess.on('exit', (code) => {
          if (code === 0) {
            logger.info(
              `Done compiling TypeScript files for tsconfig ${tsConfigPath} under ${context.projectName} ${context.targetName}`
            );
            subscriber.next({ success: true });
          } else {
            subscriber.error('Could not compile Typescript files');
          }
          subscriber.complete();
        });
      }
    } catch (error) {
      if (tscProcess) {
        killProcess();
      }
      subscriber.error(
        new Error(`Could not compile Typescript files: \n ${error}`)
      );
    }
  }).pipe(
    finalize(() => {
      cleanupTmpTsConfigFile(tsConfigPath);
    })
  );
}
