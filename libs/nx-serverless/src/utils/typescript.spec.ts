import { EventEmitter } from 'events';
import { getMockContext } from './testing';
import { MockBuilderContext } from '@nrwl/workspace/testing';
import { removeSync } from 'fs-extra';
jest.mock('fs-extra');

import { compileTypeScriptFiles } from './typescript';
jest.mock('glob');
jest.mock('@nrwl/workspace/src/utils/fileutils');
const fsUtility = require('@nrwl/workspace/src/utils/fileutils');
jest.mock('child_process');
const { fork } = require('child_process');

jest.mock('tree-kill', () =>
  jest.fn((pid, signal, callback) => {
    return callback();
  })
);

import * as fsMock from 'fs';
import { ServerlessCompileOptions } from './types';
import { callbackify } from 'util';

describe('Typescript Compiler', () => {
  let testOptions: ServerlessCompileOptions;
  let context: MockBuilderContext;
  let fakeEventEmitter: EventEmitter;
  beforeEach(async () => {
    fakeEventEmitter = new EventEmitter();
    (fakeEventEmitter as any).pid = 123;
    fork.mockReturnValue(fakeEventEmitter);
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
    fsUtility.writeJsonFile.mockImplementation(() => {});
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
          expect(
            fork
          ).toHaveBeenCalledWith(
            `${context.workspaceRoot}/node_modules/typescript/bin/tsc`,
            ['-p', testOptions.tsConfig, '--outDir', testOptions.outputPath],
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
});
