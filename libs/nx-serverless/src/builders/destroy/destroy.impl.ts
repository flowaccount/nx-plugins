import {
  BuilderContext,
  createBuilder,
  BuilderOutput
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { of, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { ServerlessWrapper } from '../../utils/serverless';
import { ServerlessDeployBuilderOptions } from '../deploy/deploy.impl';
import { ServerlessBuildEvent } from '../build/build.impl';
import { startBuild } from '../../utils/target.schedulers';

export type ServerlesCompiledEvent = {
  outfile: string;
};

export default createBuilder<ServerlessDeployBuilderOptions & JsonObject>(
  serverlessExecutionHandler
);
export function serverlessExecutionHandler(
  options: JsonObject & ServerlessDeployBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  return startBuild(options, context).pipe(
    concatMap((event: ServerlessBuildEvent) => {
      if (event.success) {
        // build into output path before running serverless offline.
        const servicePath = ServerlessWrapper.serverless.config.servicePath;
        ServerlessWrapper.serverless.config.servicePath = options.location;
        ServerlessWrapper.serverless.processedInput = {
          commands: ['remove'],
          options: getExecArgv(options)
        };
        return new Observable<BuilderOutput>(option => {
          ServerlessWrapper.serverless
            .run()
            .then(() => {
              // change servicePath back for further processing.
              ServerlessWrapper.serverless.config.servicePath = servicePath;
              option.next({ success: true });
              option.complete();
            })
            .catch(ex => {
              option.next({ success: false, error: ex.toString() });
              option.complete();
            });
        }).pipe(
          concatMap(result => {
            return of(result);
          })
        );
      } else {
        context.logger.error('There was an error with the build. See above.');
        context.logger.info(`${event.outfile} was not restarted.`);
        return of({
          success: false,
          error: `${event.outfile} was not restarted.`
        });
      }
    })
  );
}

export function getExecArgv(
  options: ServerlessDeployBuilderOptions
): Array<string> {
  const args = [];
  if (options.function && options.function != '') {
    args.push('function');
  }
  if (options.list) {
    args.push('list');
  }
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      if (
        options[key] !== undefined &&
        key !== 'buildTarget' &&
        key !== 'package' &&
        key !== 'list'
      ) {
        args.push(`--${key}=${options[key]}`);
      }
    }
  }

  return args;
}
