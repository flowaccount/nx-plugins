import * as Serverless from 'serverless/lib/Serverless';
import * as readConfiguration from 'serverless/lib/configuration/read';
import {
  ServerlessBaseOptions,
  ServerlessDeployBuilderOptions,
  ServerlessSlsBuilderOptions,
  SimpleBuildEvent,
} from './types';
import * as path from 'path';
import * as fs from 'fs';
import * as dotEnvJson from 'dotenv-json';
import { copyBuildOutputToBePackaged, parseArgs } from './copy-asset-files';
// import * as componentsV2  from '@serverless/components';
import {
  ExecutorContext,
  logger,
  parseTargetString,
  readTargetOptions,
} from '@nx/devkit';
// import * as gracefulFs from 'graceful-fs';
// gracefulFs.gracefulify(fs); // fix serverless too many files open error on windows. /wick
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

  static dispose() {
    this.serverless$ = null;
  }

  static isServerlessDeployBuilderOptions(
    arg: any
  ): arg is ServerlessDeployBuilderOptions {
    return arg.buildTarget !== undefined;
  }

  static async init(
    options: ServerlessBaseOptions
    // context: ExecutorContext
  ): Promise<void> {
    if (this.serverless$ === null) {
      logger.debug('Starting to Initiate Serverless Instance');

      const buildOptions: {
        outputPath?: string;
        servicePath?: string;
        processEnvironmentFile?: string;
        serverlessConfig?: string;
        buildTarget?: string;
      } = {};
      let deployOptions;
      // fix serverless issue wher eit resolveCliInput only once and not everytime init is called
      const commands = [];
      const extraArgs = {};
      buildOptions.servicePath = options.servicePath;
      buildOptions.processEnvironmentFile = options.processEnvironmentFile;
      buildOptions.serverlessConfig = options.serverlessConfig;
      buildOptions.outputPath = options.outputPath;

      try {
        console.log(buildOptions.servicePath);
        console.log(buildOptions.processEnvironmentFile);
        console.log(
          fs.existsSync(
            path.join(
              buildOptions.servicePath,
              buildOptions.processEnvironmentFile
            )
          )
        );
        if (
          fs.existsSync(
            path.join(
              buildOptions.servicePath,
              buildOptions.processEnvironmentFile
            )
          )
        ) {
          logger.debug(
            'Loading Environment Variables',
            buildOptions.servicePath,
            buildOptions.processEnvironmentFile
          );
          dotEnvJson({
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
          'package',
          'offline',
          'deploy list',
          'destroy',
          'deploy function',
          'sls',
        ],
        configuration: configurationInput,
        serviceDir: buildOptions.servicePath,
        servicePath: buildOptions.servicePath,
        configurationFilename: configFileName,
        configurationPath: configFileName,
        options: {},
      };
      serverlessConfig.servicePath = getPackagePath(buildOptions);
      logger.info(
        `setting serverlessConfig.servicePath to packagePath: ${serverlessConfig.servicePath}`
      );
      this.serverless$ = new Serverless(serverlessConfig);
      if (
        this.serverless$.version &&
        this.serverless$.version.split('.')[0] > '1'
      ) {
        logger.info(
          'Disabling "Resolve Configuration Internally" for serverless 2.0+.'
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
      console.log('loading service', buildOptions.serverlessConfig);
      await this.serverless$.service.load({
        config: buildOptions.serverlessConfig,
      });
      if (deployOptions) {
        this.serverless$.service.provider.stage = deployOptions.stage;
      }
      this.serverless$.cli.asciiGreeting();
      return null;
    } else {
      return null;
    }
  }
}

export function getPackagePath(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions | any
) {
  let packagePath = '';
  if (
    !options.serverlessPackagePath &&
    options.location &&
    options.location.indexOf('dist/') > -1
  ) {
    packagePath = options.location.replace(
      'dist/',
      'dist/.serverlessPackages/'
    );
  } else if (options.serverlessPackagePath) {
    packagePath = options.serverlessPackagePath;
  } else if (options.outputPath.indexOf('dist/') > -1) {
    packagePath = options.outputPath.replace(
      'dist/',
      'dist/.serverlessPackages/'
    );
  }
  logger.info(`packagePath: ${packagePath}`);
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
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions,
  commands: string[],
  extraArgs: string[] = null
) {
  // change servicePath to distribution location
  // review: Change options from location to outputpath?\
  let args = getExecArgv(options);
  const serviceDir = ServerlessWrapper.serverless.serviceDir;
  const servicePath = ServerlessWrapper.serverless.config.servicePath;

  console.log('extraArgs..................', extraArgs);

  if (extraArgs != null) {
    logger.info('concatinating function argument!');
    args = extraArgs.concat(args);
  }

  logger.info('running serverless commands');
  console.log('commands.........', commands);
  console.log('args.................', args);

  ServerlessWrapper.serverless.processedInput = {
    commands: commands,
    options: args,
  };
  ServerlessWrapper.serverless.isTelemetryReportedExternally = true;
  try {
    const packagePath = getPackagePath(options);
    logger.debug(`Serverless service path is ${packagePath}`);
    ServerlessWrapper.serverless.serviceDir = packagePath;
    ServerlessWrapper.serverless.config.servicePath = packagePath;
    await ServerlessWrapper.serverless.run();
    ServerlessWrapper.serverless.serviceDir = serviceDir;
    ServerlessWrapper.serverless.config.servicePath = servicePath;
  } catch (ex) {
    throw new Error(`There was an error with the build. ${ex}.`);
  }
}

export async function makeDistFileReadyForPackaging(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions
): Promise<void> {
  let readyToPackaged: SimpleBuildEvent = null;
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
// function resolveLocalServerlessPath() {
//   throw new Error('Function not implemented.')
// }
