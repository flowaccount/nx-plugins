"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const fs_1 = require("fs");
const treeKill = require('tree-kill');
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
let tscProcess;
function cleanupTmpTsConfigFile(tsConfigPath) {
    if (tsConfigPath.indexOf('.nx-tmp') > -1) {
        fs_1.unlinkSync(tsConfigPath);
    }
}
function killProcess(context) {
    return treeKill(tscProcess.pid, 'SIGTERM', error => {
        tscProcess = null;
        if (error) {
            if (Array.isArray(error) && error[0] && error[2]) {
                const errorMessage = error[2];
                context.logger.error(errorMessage);
            }
            else if (error.message) {
                context.logger.error(error.message);
            }
        }
    });
}
function compileTypeScriptFiles(options, context
// projectDependencies: DependentLibraryNode[]
) {
    if (tscProcess) {
        killProcess(context);
    }
    // Cleaning the /dist folder
    if (!options.skipClean) {
        fs_extra_1.removeSync(options.outputPath);
    }
    const tsConfigPath = options.tsConfig;
    return rxjs_1.Observable.create((subscriber) => {
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
            const tscPath = path_1.join(context.workspaceRoot, '/node_modules/typescript/bin/tsc');
            if (options.watch) {
                context.logger.info('Starting TypeScript watch');
                args.push('--watch');
                tscProcess = child_process_1.fork(tscPath, args, { stdio: [0, 1, 2, 'ipc'] });
                subscriber.next({ success: true });
            }
            else {
                context.logger.info(`Compiling TypeScript files for tsconfig ${tsConfigPath} under ${context.target.project}...`);
                tscProcess = child_process_1.fork(tscPath, args, { stdio: [0, 1, 2, 'ipc'] });
                tscProcess.on('exit', code => {
                    if (code === 0) {
                        context.logger.info(`Done compiling TypeScript files for tsconfig ${tsConfigPath} under ${context.target.project}`);
                        subscriber.next({ success: true });
                    }
                    else {
                        subscriber.error('Could not compile Typescript files');
                    }
                    subscriber.complete();
                });
            }
        }
        catch (error) {
            if (tscProcess) {
                killProcess(context);
            }
            subscriber.error(new Error(`Could not compile Typescript files: \n ${error}`));
        }
    }).pipe(operators_1.finalize(() => {
        cleanupTmpTsConfigFile(tsConfigPath);
    }));
}
exports.compileTypeScriptFiles = compileTypeScriptFiles;
//# sourceMappingURL=typescript.js.map