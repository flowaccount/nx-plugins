import * as Serverless from 'serverless/lib/Serverless'; // 'D:/Projects/opensource/nx-11-test/nx-11-test-serverless/node_modules/serverless/lib/Serverless.js';
import { ServerlessBaseOptions } from './types';
import { mergeMap, concatMap } from 'rxjs/operators';
import { of, Observable, from } from 'rxjs';
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

  static init<T extends ServerlessBaseOptions>(
    options: T,
    context: ExecutorContext
  ): Observable<void> {
    if (this.serverless$ === null) {
      logger.debug('Starting to Initiate Serverless Instance');

      let buildOptions;
      if (ServerlessWrapper.isServerlessDeployBuilderOptions(options)) {
        const buildTarget = parseTargetString(options.buildTarget);
        buildOptions = readTargetOptions<{ buildTarget: string } & JsonObject>(
          buildTarget,
          context
        );
        if (!buildOptions) {
          options = buildOptions;
        }
      }
      return from(Promise.resolve(options)).pipe(
        mergeMap((options: T) => {
          try {
            if (
              fs.existsSync(
                path.join(options.servicePath, options.processEnvironmentFile)
              )
            ) {
              logger.debug('Loading Environment Variables');
              require('dotenv-json')({
                path: path.join(
                  options.servicePath,
                  options.processEnvironmentFile
                ),
              });
              logger.info(
                `Environment variables set according to ${options.processEnvironmentFile}`
              );
            } else {
              logger.error('No env.json found! no environment will be set!');
            }
          } catch (e) {
            logger.error(e);
          }
          // if (componentsV2.runningComponents()) return () => componentsV2.runComponents();
          logger.debug('Initiating Serverless Instance');
          this.serverless$ = new Serverless({
            config: options.serverlessConfig,
            servicePath: options.servicePath,
            configuration: { useDotenv: false },
          });
          if (
            this.serverless$.version &&
            this.serverless$.version.split('.')[0] > '1'
          ) {
            logger.info(
              'Disable "Resolve Configuration Internally" for serverless 2.0+.'
            );
            this.serverless$._shouldResolveConfigurationInternally = false;
            this.serverless$.serviceDir = options.servicePath;
            this.serverless$.configurationFilename = 'serverless.yml';
            this.serverless$.config.commands = [
              'deploy',
              'offline',
              'deploy list',
              'destroy',
              'deploy function',
              'sls',
            ];
          }
          return this.serverless$.init();
        }),
        concatMap(() => {
          return this.serverless$.service.load({
            config: options.serverlessConfig,
          });
        }),
        concatMap(() => {
          return this.serverless$.variables
            .populateService(this.serverless$.pluginManager.cliOptions)
            .then(() => {
              // merge arrays after variables have been populated
              // (https://github.com/serverless/serverless/issues/3511)
              this.serverless$.service.mergeArrays();
              // validate the service configuration, now that variables are loaded
              this.serverless$.service.validate();
            });
        }),
        concatMap(() => {
          this.serverless$.cli.asciiGreeting();
          return of(null);
        })
      );
    } else {
      return of(null);
    }
  }
}

export function getExecArgv(
  options: ServerlessDeployBuilderOptions | ServerlessSlsBuilderOptions
) {
  const serverlessOptions = [];
  const extraArgs = parseArgs(options);

  Object.keys(extraArgs).map((a) =>
    serverlessOptions.push(`--${a} ${extraArgs[a]}`)
  );
  return serverlessOptions;
}

export async function runServerlessCommand(
  options:
    | (JsonObject & ServerlessDeployBuilderOptions)
    | (JsonObject & ServerlessSlsBuilderOptions),
  commands: string[],
  packagePath: string,
  extraArgs: string[] = null
) {
  // change servicePath to distribution location
  // review: Change options from location to outputpath?\
  const servicePath = ServerlessWrapper.serverless.config.servicePath;
  let args = getExecArgv(options);
  if (extraArgs) {
    args = args.concat(extraArgs);
  }
  ServerlessWrapper.serverless.config.servicePath = path.resolve(packagePath);
  logger.info('running serverless commands');
  ServerlessWrapper.serverless.processedInput = {
    commands: commands,
    options: args,
  };
  // console.log(ServerlessWrapper.serverless.service.provider.name)
  ServerlessWrapper.serverless.isTelemetryReportedExternally = true;
  try {
    await ServerlessWrapper.serverless.run();
    ServerlessWrapper.serverless.config.servicePath = servicePath;
  } catch (ex) {
    throw new Error(`There was an error with the build. ${ex}.`);
  }
}

export async function makeDistFileReadyForPackaging(
  options:
    | (JsonObject & ServerlessDeployBuilderOptions)
    | (JsonObject & ServerlessSlsBuilderOptions),
  packagePath: string
): Promise<string> {
  let readyToPackaged: BuilderOutput = null;
  if (
    !options.serverlessPackagePath &&
    options.location.indexOf('dist/') > -1
  ) {
    packagePath = options.location.replace(
      'dist/',
      'dist/.serverlessPackages/'
    );
  } else if (options.serverlessPackagePath) {
    packagePath = options.serverlessPackagePath;
  }
  logger.info(packagePath);
  options.serverlessPackagePath = packagePath;
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
  return packagePath;
}
function resolveLocalServerlessPath() {
  throw new Error('Function not implemented.');
}
