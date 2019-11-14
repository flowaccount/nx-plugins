import { BuilderContext, createBuilder, BuilderOutput } from '@angular-devkit/architect';
import { JsonObject, workspaces } from '@angular-devkit/core';
import { Observable } from 'rxjs';
// import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { exec } from 'child_process';
import { TEN_MEGABYTES } from '@nrwl/workspace/src/command-line/shared';
import { BuildBuilderOptions, ServerlessOfflineOptions } from '../../utils/types';
export interface ServerlessBuildBuilderOptions extends ServerlessOfflineOptions {
   
}
export default createBuilder<ServerlessBuildBuilderOptions & JsonObject>(run);

export function run(
    options:  JsonObject & ServerlessBuildBuilderOptions,
    context: BuilderContext
): Observable<BuilderOutput> {
    return Observable.create(async observer => { 
        try {
          context.logger.info("options sent in: " + options.location, options);
            const success = await runSerially(options, context)
            observer.next({ success})
        } catch (e) {
            observer.next(
              `ERROR: Something went wrong in @nx/serverless - ${e.message}`
            );
        }
    })
}
async function runSerially(
    options: ServerlessBuildBuilderOptions,
    context: BuilderContext
  ) {

    const failedCommand =  await createProcess(
            "node_modules\\.bin\\serverless offline --config " + options.location + " --location " + options.location,
            options.readyWhen ? options.readyWhen : "success",
            options,
            context
          );
    if (failedCommand) {
      context.logger.warn(
        `Warning: @nx/serverless command "${failedCommand}" exited with non-zero status code`
      );
      return false;
    }
    return true;
  }
  function createProcess(
    command: string,
    readyWhen: string,
    parsedArgs: ServerlessOfflineOptions,
    context: BuilderContext
  ): Promise<boolean> {
    command = transformCommand(command, parsedArgs);
    context.logger.info(command);
    return new Promise(res => {
      const childProcess = exec(command, { maxBuffer: TEN_MEGABYTES });
      /**
       * Ensure the child process is killed when the parent exits
       */
      process.on('exit', () => childProcess.kill());
      childProcess.stdout.on('data', data => {
        process.stdout.write(data);
        if (readyWhen && data.toString().indexOf(readyWhen) > -1) {
          res(true);
        }
      });
      childProcess.stderr.on('data', err => {
        process.stderr.write(err);
        if (readyWhen && err.toString().indexOf(readyWhen) > -1) {
          res(true);
        }
      });
      childProcess.on('close', code => {
        if (!readyWhen) {
          res(code === 0);
        }
      });
    });
  }

  function transformCommand(command: string, args: any) {
    const regex = /{args\.([^}]+)}/g;
    return command.replace(regex, (_, group: string) => args[group]);
  }