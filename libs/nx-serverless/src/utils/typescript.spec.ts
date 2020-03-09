import { EventEmitter } from 'events';
import { join } from 'path';
import { getMockContext } from './testing';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import {
    ProjectGraph,
    ProjectType
} from '@nrwl/workspace/src/core/project-graph';
import * as projectGraphUtils from '@nrwl/workspace/src/core/project-graph';
import { removeSync } from 'fs-extra';
jest.mock('fs-extra')

import {
    compileTypeScriptFiles
} from './typescript';
jest.mock('glob');
jest.mock('@nrwl/workspace/src/utils/fileutils');
let fsUtility = require('@nrwl/workspace/src/utils/fileutils');
jest.mock('child_process');
let { fork } = require('child_process');
jest.mock('tree-kill');
let treeKill = require('tree-kill');
import * as fsMock from 'fs';
import { ServerlessCompileOptions } from './types';

describe('NodeCompileBuilder', () => {
    let testOptions: ServerlessCompileOptions;
    let context: MockBuilderContext;
    let fakeEventEmitter: EventEmitter;
    beforeEach(async () => {
        fakeEventEmitter = new EventEmitter();
        (fakeEventEmitter as any).pid = 123;
        fork.mockReturnValue(fakeEventEmitter);
        treeKill.mockImplementation((pid, signal, callback) => {
            callback();
        });

        fsUtility.readJsonFile.mockImplementation((arg: string) => {
            if (arg.endsWith('tsconfig.lib.json')) {
                return {
                    extends: './tsconfig.json',
                    compilerOptions: {
                        outDir: '../../dist/out-tsc',
                        declaration: true,
                        rootDir: './src',
                        types: ['node']
                    },
                    exclude: ['**/*.spec.ts'],
                    include: ['**/*.ts']
                };
            } else {
                return {
                    name: 'nodelib'
                };
            }
        });
        fsUtility.writeJsonFile.mockImplementation(() => { });
        context = await getMockContext();
        context.target.project = 'nodelib';
        testOptions = {
            assets: [],
            outputPath: 'dist/libs/nodelib',
            tsConfig: 'libs/nodelib/tsconfig.lib.json',
            watch: false,
            sourceMap: false,
            package: 'apps/serverlessapp',
            serverlessConfig: 'apps/serverlessapp/serverless.yml',
            servicePath: 'apps/serverlessapp',
            processEnvironmentFile: 'env.json',
            skipClean: false
        };
    });

    describe('Without library dependencies', () => {
        beforeEach(() => {
            // mock createProjectGraph without deps
           
        });

        it('should call tsc to compile', done => {
            compileTypeScriptFiles(testOptions, context).subscribe({
                complete: () => {
                    expect(fork).toHaveBeenCalledWith(
                        `${context.workspaceRoot}/node_modules/typescript/bin/tsc`,
                        [
                            '-p',
                            testOptions.tsConfig,
                            '--outDir',
                            testOptions.outputPath
                        ],
                        { stdio: [0, 1, 2, 'ipc'] }
                    );

                    done();
                }
            });
            fakeEventEmitter.emit('exit', 0);
        });
        it('should have the output success true in the BuilderOutput', done => {
            compileTypeScriptFiles(testOptions, context).subscribe({
                next: value => {
                    expect(value.success).toEqual(true);
                },
                complete: () => {
                    done();
                }
            });
            fakeEventEmitter.emit('exit', 0);
        });
        it('should call removesync if not skipClean', done => {
            compileTypeScriptFiles(testOptions, context).subscribe({
                complete: () => {
                    expect(removeSync).toHaveBeenCalled();
                    done();
                }
            });
            fakeEventEmitter.emit('exit', 0);
        });
    });

    //   describe('building with dependencies', () => {
    //     beforeEach(() => {
    //       spyOn(projectGraphUtils, 'createProjectGraph').and.callFake(() => {
    //         return {
    //           nodes: {
    //             nodelib: {
    //               type: ProjectType.lib,
    //               name: 'nodelib',
    //               data: { files: [], root: 'libs/nodelib' }
    //             },
    //             'nodelib-child': {
    //               type: ProjectType.lib,
    //               name: 'nodelib-child',
    //               data: {
    //                 files: [],
    //                 root: 'libs/nodelib-child',
    //                 prefix: 'proj',
    //                 architect: {
    //                   build: {
    //                     builder: 'any builder',
    //                     options: {
    //                       assets: [],
    //                       main: 'libs/nodelib-child/src/index.ts',
    //                       outputPath: 'dist/libs/nodelib-child',
    //                       packageJson: 'libs/nodelib-child/package.json',
    //                       tsConfig: 'libs/nodelib-child/tsconfig.lib.json'
    //                     }
    //                   }
    //                 }
    //               }
    //             }
    //           },
    //           dependencies: {
    //             nodelib: [
    //               {
    //                 type: ProjectType.lib,
    //                 target: 'nodelib-child',
    //                 source: null
    //               }
    //             ],
    //             'nodelib-child': []
    //           }
    //         } as ProjectGraph;
    //       });

    //       // fake that dep project has been built
    //       // dist/libs/nodelib-child/package.json
    //       fsUtility.fileExists.mockImplementation((arg: string) => {
    //         if (arg.endsWith('dist/libs/nodelib-child/package.json')) {
    //           return true;
    //         } else {
    //           return false;
    //         }
    //       });

    //       // fsMock.unlinkSync.mockImplementation(() => {});

    //       spyOn(fsMock, 'unlinkSync');
    //     });

    //     // it('should call the tsc compiler with the modified tsconfig.json', done => {
    //     //   const tmpTsConfigPath = join(
    //     //     context.workspaceRoot,
    //     //     'libs/nodelib',
    //     //     'tsconfig.lib.nx-tmp'
    //     //   );

    //     //   compileTypeScriptFiles(testOptions, context).subscribe({
    //     //     complete: () => {
    //     //       expect(fork).toHaveBeenCalledWith(
    //     //         `${context.workspaceRoot}/node_modules/typescript/bin/tsc`,
    //     //         [
    //     //           '-p',
    //     //           tmpTsConfigPath,
    //     //           // join(context.workspaceRoot, testOptions.tsConfig),
    //     //           '--outDir',
    //     //           join(context.workspaceRoot, testOptions.outputPath)
    //     //         ],
    //     //         { stdio: [0, 1, 2, 'ipc'] }
    //     //       );

    //     //       done();
    //     //     }
    //     //   });
    //     //   fakeEventEmitter.emit('exit', 0);

    //     //   // assert temp tsconfig file gets deleted again
    //     //   expect(fsMock.unlinkSync).toHaveBeenCalledWith(tmpTsConfigPath);
    //     // });
    //   });
});
