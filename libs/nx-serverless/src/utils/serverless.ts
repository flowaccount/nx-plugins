import * as Serverless from 'serverless/lib/Serverless';
import * as readConfiguration from 'serverless/lib/configuration/read';
import { ServerlessBaseOptions } from './types';
import * as path from 'path';
import * as fs from 'fs';
import { ServerlessDeployBuilderOptions } from '../builders/deploy/deploy.impl';
import { copyBuildOutputToBePackaged, parseArgs } from './copy-asset-files';
import { ServerlessSlsBuilderOptions } from '../builders/sls/sls.impl';
// import * as componentsV2  from '@serverless/components';
import {
  ExecutorContext,
  logger,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
import { JsonObject } from '@angular-devkit/core';
import { BuilderOutput } from '@angular-devkit/architect';
import * as gracefulFs from 'graceful-fs';
gracefulFs.gracefulify(fs); // fix serverless too many files open error on windows. /wick
export class ServerlessWrapper {
  constructor() {}

  private static serverless$: any = null;

  static get serverless() {
    if (this.serverless$ === null) {
      throw new Error(
        'Please initialize serverless before usage, or pass option for initialization.'
      );
    }
    return this.serverless$;
  }

  static isServerlessDeployBuilderOptions(
    arg: any
  ): arg is ServerlessDeployBuilderOptions {
    return arg.buildTarget !== undefined;
  }

  static async init(
    options: ServerlessBaseOptions | ServerlessDeployBuilderOptions,
    context: ExecutorContext
  ): Promise<void> {
    if (this.serverless$ === null) {
      logger.debug('Starting to Initiate Serverless Instance');

      let buildOptions;
      let deployOptions;
      // fix serverless issue wher eit resolveCliInput only once and not everytime init is called
      const commands = [];
      const extraArgs = {};

      if (ServerlessWrapper.isServerlessDeployBuilderOptions(options)) {
        deployOptions = options;
        commands.push('deploy');
        if (deployOptions.function && deployOptions.function != '') {
          commands.push('function');
          extraArgs['function'] = `${deployOptions.function}`;
        }
        if (deployOptions.list) {
          commands.push('list');
        }
        const buildTarget = parseTargetString(deployOptions.buildTarget);
        buildOptions = readTargetOptions<{ buildTarget: string } & JsonObject>(
          buildTarget,
          context
        );
        if (buildOptions) {
          options = buildOptions;
        }
      } else {
        buildOptions = options;
      }
      try {
        if (
          fs.existsSync(
            path.join(
              buildOptions.servicePath,
              buildOptions.processEnvironmentFile
            )
          )
        ) {
          logger.debug('Loading Environment Variables');
          require('dotenv-json')({
            path: path.join(
              buildOptions.servicePath,
              buildOptions.processEnvironmentFile
            ),
          });
          logger.info(
            `Environment variables set according to ${buildOptions.processEnvironmentFile}`
          );
        } else {
          logger.error('No env.json found! no environment will be set!');
        }
      } catch (e) {
        logger.error(e);
      }
      logger.debug('Reading Configuration');
      const typescriptConfig = fs.existsSync(
        path.join(buildOptions.servicePath, 'serverless.ts')
      );
      const configFileName = typescriptConfig
        ? 'serverless.ts'
        : 'serverless.yml';
      const configurationInput = await readConfiguration(
        path.resolve(buildOptions.servicePath, configFileName)
      );
      logger.debug('Resolved configurations');
      configurationInput.useDotenv = false;
      logger.debug('Initiating Serverless Instance');

      const serverlessConfig: any = {
        commands: [
          'deploy',
          'offline',
          'deploy list',
          'destroy',
          'deploy function',
          'sls',
        ],
        configuration: configurationInput,
        serviceDir: buildOptions.servicePath,
        configurationFilename: configFileName,
      };
      if (deployOptions) {
        serverlessConfig.serviceDir = getPackagePath(deployOptions);
      }
      this.serverless$ = new Serverless(serverlessConfig);
      // if (componentsV2.runningComponents()) return () => componentsV2.runComponents();
      if (
        this.serverless$.version &&
        this.serverless$.version.split('.')[0] > '1'
      ) {
        logger.info(
          'Disable "Resolve Configuration Internally" for serverless 2.0+.'
        );
        this.serverless$._shouldResolveConfigurationInternally = false;
        this.serverless$.isLocallyInstalled = true;
      }
      // fix serverless issue wher eit resolveCliInput only once and not everytime init is called
      if (deployOptions) {
        this.serverless$.processedInput = {
          commands: commands,
          options: extraArgs,
        };
        logger.info('serverless$.processedInput is set with deploy arguments');
      }
      // fix serverless issue wher eit resolveCliInput only once and not everytime init is called
      await this.serverless$.init();
      await this.serverless$.service.load({
        config: buildOptions.serverlessConfig,
      });
      if (deployOptions) {
        this.serverless$.service.provider.stage = deployOptions.stage;
      }
      await this.serverless$.variables
        .populateService(this.serverless$.pluginManager.cliOptions)
        .then(() => {
          // merge arrays after variables have been populated
          // (https://github.com/serverless/serverless/issues/3511)
          this.serverless$.service.mergeArrays();
          // validate the service configuration, now that variables are loaded
          this.serverless$.service.validate();
        });
      this.serverless$.cli.asciiGreeting();
      return null;
    } else {
      return null;
    }
  }
}

function getPackagePath(
  deployOptions:
    | (JsonObject & ServerlessDeployBuilderOptions)
    | (JsonObject & ServerlessSlsBuilderOptions)
) {
  let packagePath = '';
  if (
    !deployOptions.serverlessPackagePath &&
    deployOptions.location.indexOf('dist/') > -1
  ) {
    packagePath = deployOptions.location.replace(
      'dist/',
      'dist/.serverlessPackages/'
    );
  } else if (deployOptions.serverlessPackagePath) {
    packagePath = deployOptions.serverlessPackagePath;
  }
  return packagePath;
}

export function getExecArgv(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions
) {
  const serverlessOptions = [];
  const extraArgs = parseArgs(options);

  Object.keys(extraArgs).map((a) =>
    serverlessOptions.push(`--${a} ${extraArgs[a]}`)
  );
  console.log(serverlessOptions);
  return serverlessOptions;
}

export async function runServerlessCommand(
  options:
    | (JsonObject & ServerlessDeployBuilderOptions)
    | (JsonObject & ServerlessSlsBuilderOptions),
  commands: string[],
  extraArgs: string[] = null
) {
  // change servicePath to distribution location
  // review: Change options from location to outputpath?\
  let args = getExecArgv(options);
  const serviceDir = ServerlessWrapper.serverless.serviceDir;
  if (extraArgs) {
    args = args.concat(extraArgs);
  }
  logger.info('running serverless commands');
  ServerlessWrapper.serverless.processedInput = {
    commands: commands,
    options: args,
  };
  ServerlessWrapper.serverless.isTelemetryReportedExternally = true;
  try {
    const packagePath = getPackagePath(options);
    logger.debug(`Serverless service path is ${packagePath}`);
    ServerlessWrapper.serverless.serviceDir = packagePath;
    await ServerlessWrapper.serverless.run();
    ServerlessWrapper.serverless.serviceDir = serviceDir;
  } catch (ex) {
    throw new Error(`There was an error with the build. ${ex}.`);
  }
}

export async function makeDistFileReadyForPackaging(
  options:
    | (JsonObject & ServerlessDeployBuilderOptions)
    | (JsonObject & ServerlessSlsBuilderOptions)
): Promise<void> {
  let readyToPackaged: BuilderOutput = null;
  options.serverlessPackagePath = getPackagePath(options);
  readyToPackaged = await copyBuildOutputToBePackaged(options);
  if (readyToPackaged == null) {
    throw new Error(
      `readyToPackaged is null something went wrong in 'copyBuildOutputToBePackaged'.`
    );
  }
  if (!readyToPackaged.success) {
    throw new Error(
      `readyToPackaged is null something went wrong in 'copyBuildOutputToBePackaged'.`
    );
  }
}
function resolveLocalServerlessPath() {
  throw new Error('Function not implemented.');
}
