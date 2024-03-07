import * as Serverless from 'serverless/lib/Serverless';
import * as readConfiguration from 'serverless/lib/configuration/read';
import {
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
} from '@nx/devkit';
import { getProjectRoot } from './normalize';
import * as chalk from 'chalk';

export class ServerlessWrapper {
 
  private static serverless$: any = null;
  private static configurationInput$: any = null;


  static get serverless() {
    if (this.serverless$ === null) {
      throw new Error(
        'Please initialize serverless before usage, or pass option for initialization.'
      );
    }
    return this.serverless$;
  }

  static get configurationInput() {
    if (this.configurationInput$ === null) {
      throw new Error(
        'Please initialize serverless before usage, or pass option for initialization.'
      );
    }
    return this.configurationInput$;
  }
  

  static dispose() {
    this.serverless$ = null;
    this.configurationInput$ = null;
  }

  static isServerlessDeployBuilderOptions(
    arg: any
  ): arg is ServerlessDeployBuilderOptions {
    return arg.buildTarget !== undefined;
  }

  static async init(
    context: ExecutorContext,
    processEnvironmentFile: string
  ): Promise<void> {
    if (this.serverless$ === null) {
      const info = chalk.bold.green('info')

      logger.info(`${info} Starting to Initiate Serverless Instance`);

      const projectRoot = getProjectRoot(context);
      try {
        const filePath = path.join(
          projectRoot,
          processEnvironmentFile
        );
        logger.info(`${info} Loading Environment Variables ${filePath}`);
        dotEnvJson({
          path: filePath,
        });

        logger.info(`${info} Reading Configuration`);
        const typescriptConfig = fs.existsSync(
          path.join(projectRoot, 'serverless.ts')
        );
        const configFileName = typescriptConfig
          ? 'serverless.ts'
          : 'serverless.yml';
        this.configurationInput$ = await readConfiguration(
          path.resolve(projectRoot, configFileName)
        );
        logger.info(`${info} Resolved configurations`);
        this.configurationInput$.useDotenv = false;
        logger.info(`${info} Initiating Serverless Instance`);
      }
      catch (ex) {
        logger.error(ex);
      }
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
