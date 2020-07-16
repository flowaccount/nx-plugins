import * as Serverless from 'serverless/lib/Serverless';
import { ServerlessBaseOptions } from './types';
import {
  targetFromTargetString,
  BuilderContext
} from '@angular-devkit/architect';
import { from } from 'rxjs/internal/observable/from';
import { mergeMap, concatMap } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs';
import { ServerlessDeployBuilderOptions } from '../builders/deploy/deploy.impl';
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
    context: BuilderContext
  ): Observable<void> {
    if (this.serverless$ === null) {
      return from(Promise.resolve(options)).pipe(
        mergeMap((options: T) => {
          if (ServerlessWrapper.isServerlessDeployBuilderOptions(options)) {
            const target = targetFromTargetString(options.buildTarget);
            return from(
              Promise.all([
                context.getTargetOptions(target),
                context.getBuilderNameForTarget(target)
              ]).then(([options, builderName]) => {
                context.validateOptions(options, builderName);
                return options;
              })
            );
          } else {
            return of(options);
          }
        }),
        concatMap((options: T) => {
          try {
            if (
              fs.existsSync(
                path.join(options.servicePath, options.processEnvironmentFile)
              )
            ) {
              require('dotenv-json')({
                path: path.join(
                  options.servicePath,
                  options.processEnvironmentFile
                )
              });
              context.logger.info(
                `Environment variables set according to ${options.processEnvironmentFile}`
              );
            } else {
              context.logger.error(
                'No env.json found! no environment will be set!'
              );
            }
          } catch (e) {
            context.logger.error(e);
          }
          this.serverless$ = new Serverless({
            config: options.serverlessConfig,
            servicePath: options.servicePath
          });
          return this.serverless$.init();
        }),
        concatMap(() => {
          return this.serverless$.service.load({
            config: options.serverlessConfig
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
