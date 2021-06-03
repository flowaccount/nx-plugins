let buildOptions;

jest.mock('@nrwl/devkit');
const devkit = require('@nrwl/devkit');
import { ExecutorContext, logger } from '@nrwl/devkit';
jest.mock('child_process');
let { fork } = require('child_process');
jest.mock('tree-kill');
let treeKill = require('tree-kill');

import {
  offlineExecutor,
  InspectType,
  ServerlessExecuteBuilderOptions,
} from './offline.impl';

describe('NodeExecuteBuilder', () => {
  let testOptions: ServerlessExecuteBuilderOptions;
  let context: ExecutorContext;

  beforeEach(async () => {
    buildOptions = {};

    (devkit.runExecutor as any).mockImplementation(function* () {
      yield { success: true, outfile: 'outfile.js' };
    });

    (devkit.readTargetOptions as any).mockImplementation(() => buildOptions);

    (devkit.parseTargetString as any).mockImplementation(
      jest.requireActual('@nrwl/devkit').parseTargetString
    );

    fork.mockImplementation(() => {
      return {
        on: (eventName, cb) => {
          if (eventName === 'exit') {
            cb();
          }
        },
      };
    });

    treeKill.mockImplementation((pid, signal, callback) => {
      callback();
    });
    context = {
      root: '/root',
      cwd: '/root',
      workspace: {
        version: 2,
        projects: {
          nodeapp: {
            root: '/root/nodeapp',
            targets: {
              build: {
                executor: 'build',
                options: {},
              },
            },
          },
        },
      },
      isVerbose: false,
    };
    testOptions = {
      inspect: true,
      args: [],
      runtimeArgs: [],
      buildTarget: 'nodeapp:build',
      port: 9229,
      waitUntilTargets: [],
      host: 'localhost',
      watch: true,
      readyWhen: '',
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should build the application and start the built file', async (done) => {
    for await (const event of offlineExecutor(testOptions, context)) {
      expect(event.success).toEqual(true);
    }
    expect(require('@nrwl/devkit').runExecutor).toHaveBeenCalledWith(
      {
        project: 'nodeapp',
        target: 'build',
      },
      {
        watch: true,
      },
      context
    );
    expect(fork).toHaveBeenCalledWith('outfile.js', [], {
      execArgv: [
        '-r',
        'source-map-support/register',
        '--inspect=localhost:9229',
      ],
    });
    expect(treeKill).toHaveBeenCalledTimes(0);
    expect(fork).toHaveBeenCalledTimes(1);
    done();
  });

  describe('--inspect', () => {
    describe('inspect', () => {
      it('should inspect the process', async (done) => {
        for await (const event of offlineExecutor(
          {
            ...testOptions,
            inspect: InspectType.Inspect,
          },
          context
        )) {
        }
        expect(fork).toHaveBeenCalledWith('outfile.js', [], {
          execArgv: [
            '-r',
            'source-map-support/register',
            '--inspect=localhost:9229',
          ],
        });
        done();
      });
    });

    describe('inspect-brk', () => {
      it('should inspect and break at beginning of execution', async (done) => {
        for await (const event of offlineExecutor(
          {
            ...testOptions,
            inspect: InspectType.InspectBrk,
          },
          context
        )) {
        }
        expect(fork).toHaveBeenCalledWith('outfile.js', [], {
          execArgv: [
            '-r',
            'source-map-support/register',
            '--inspect-brk=localhost:9229',
          ],
        });
        done();
      });
    });
  });

  describe('--host', () => {
    describe('0.0.0.0', () => {
      it('should inspect the process on host 0.0.0.0', async (done) => {
        for await (const event of offlineExecutor(
          {
            ...testOptions,
            host: '0.0.0.0',
          },
          context
        )) {
        }
        expect(fork).toHaveBeenCalledWith('outfile.js', [], {
          execArgv: [
            '-r',
            'source-map-support/register',
            '--inspect=0.0.0.0:9229',
          ],
        });
        done();
      });
    });
  });

  describe('--port', () => {
    describe('1234', () => {
      it('should inspect the process on port 1234', async (done) => {
        for await (const event of offlineExecutor(
          {
            ...testOptions,
            port: 1234,
          },
          context
        )) {
        }
        expect(fork).toHaveBeenCalledWith('outfile.js', [], {
          execArgv: [
            '-r',
            'source-map-support/register',
            '--inspect=localhost:1234',
          ],
        });
        done();
      });
    });
  });

  describe('--runtimeArgs', () => {
    it('should add runtime args to the node process', async (done) => {
      for await (const event of offlineExecutor(
        {
          ...testOptions,
          runtimeArgs: ['-r', 'node-register'],
        },
        context
      )) {
      }
      expect(fork).toHaveBeenCalledWith('outfile.js', [], {
        execArgv: [
          '-r',
          'source-map-support/register',
          '-r',
          'node-register',
          '--inspect=localhost:9229',
        ],
      });
      done();
    });
  });

  it('should log errors from killing the process', async (done) => {
    treeKill.mockImplementation((pid, signal, callback) => {
      callback(new Error('Error Message'));
    });

    const loggerError = jest.spyOn(logger, 'error');

    for await (const event of offlineExecutor(testOptions, context)) {
    }
    expect(loggerError).toHaveBeenCalledWith('Error Message');
    done();
  });

  it('should log errors from killing the process on windows', async (done) => {
    treeKill.mockImplementation((pid, signal, callback) => {
      callback([new Error('error'), '', 'Error Message']);
    });

    const loggerError = jest.spyOn(logger, 'error');

    for await (const event of offlineExecutor(
      {
        ...testOptions,
        runtimeArgs: ['-r', 'node-register'],
      },
      context
    )) {
    }
    expect(loggerError).toHaveBeenLastCalledWith('Error Message');
    done();
  });

  it('should build the application and start the built file with options', async (done) => {
    for await (const event of offlineExecutor(
      {
        ...testOptions,
        inspect: false,
        args: ['arg1', 'arg2'],
      },
      context
    )) {
    }
    expect(fork).toHaveBeenCalledWith('outfile.js', ['arg1', 'arg2'], {
      execArgv: ['-r', 'source-map-support/register'],
    });
    done();
  });

  it('should warn users who try to use it in production', async (done) => {
    buildOptions = {
      optimization: true,
    };
    const loggerWarn = jest.spyOn(logger, 'warn');
    for await (const event of offlineExecutor(
      {
        ...testOptions,
        inspect: false,
        args: ['arg1', 'arg2'],
      },
      context
    )) {
    }
    expect(loggerWarn).toHaveBeenCalled();
    done();
  });

  describe('waitUntilTasks', () => {
    it('should run the tasks before starting the build', async (done) => {
      const runExecutor = require('@nrwl/devkit').runExecutor;
      for await (const event of offlineExecutor(
        {
          ...testOptions,
          waitUntilTargets: ['project1:target1', 'project2:target2'],
        },
        context
      )) {
      }

      expect(runExecutor).toHaveBeenCalledTimes(3);
      expect(runExecutor).toHaveBeenNthCalledWith(
        1,
        {
          project: 'project1',
          target: 'target1',
        },
        {},
        context
      );
      expect(runExecutor).toHaveBeenCalledWith(
        {
          project: 'project2',
          target: 'target2',
        },
        {},
        context
      );
      done();
    });

    it('should not run the build if any of the tasks fail', async (done) => {
      devkit.runExecutor.mockImplementation(function* () {
        yield { success: false };
      });

      try {
        for await (const event of offlineExecutor(
          {
            ...testOptions,
            waitUntilTargets: ['project1:target1', 'project2:target2'],
          },
          context
        )) {
        }
      } catch (e) {
        expect(e.message).toMatchInlineSnapshot(
          `"Wait until target failed: project1:target1."`
        );
      }
      done();
    });
  });
});
