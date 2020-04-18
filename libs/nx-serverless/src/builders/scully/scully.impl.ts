// npx scully --nw --configFile apps/frontend/flowaccount-landing/scully.config.js --removeStaticDist

import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget,
  BuilderRun
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, from } from 'rxjs';
import { concatMap, tap } from 'rxjs/operators';

export interface ScullyBuilderOptions extends JsonObject {
  buildTarget: string;
  skipBuild: boolean;
  configFiles: string[];
  showGuessError?: boolean;
  showBrowser?: boolean;
  removeStaticDist?: boolean;
  baseFilter?: string;
  proxy?: string;
  open?: boolean;
  scanRoutes?: boolean;
  highlight?: boolean;
}

export default createBuilder<ScullyBuilderOptions & JsonObject>(
  scullyCmdRunner
);
export function scullyCmdRunner(
  options: JsonObject & ScullyBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  //
  return startBuild(options, context).pipe(
    concatMap(v => {
      if (!v.success) {
        context.logger.error('Build target failed!');
        return of({ success: false });
      }
      const commands: { command: string }[] = [];

      const args = getExecArgv(options);
      options.configFiles.forEach(fileName => {
        commands.push({
          command: `scully --configFile=${fileName} ${args.join(' ')}`
        });
      });
      return context.scheduleBuilder('@nrwl/workspace:run-commands', {
        commands: commands,
        cwd: options.root,
        color: true,
        parallel: false
      });
    }),
    concatMap((result: BuilderRun) => {
      return result.output;
    })
  );
}

export function startBuild(
  options: ScullyBuilderOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  const target = targetFromTargetString(options.buildTarget);
  return from(
    Promise.all([
      context.getTargetOptions(target),
      context.getBuilderNameForTarget(target)
    ]).then(([options, builderName]) =>
      context.validateOptions(options, builderName)
    )
  ).pipe(
    tap(() => {
      const art = `
          _   ___  __     ___        ______         ____ ____  _  __ __        ______     _    ____  ____  _____ ____  
         | \\ | \\ \\/ /    / \\ \\      / / ___|       / ___|  _ \\| |/ / \\ \\      / |  _ \\   / \\  |  _ \\|  _ \\| ____|  _ \\ 
         |  \\| |\\  /    / _ \\ \\ /\\ / /\\___ \\ _____| |   | | | | ' /   \\ \\ /\\ / /| |_) | / _ \\ | |_) | |_) |  _| | |_) |
         | |\\  |/  \\   / ___ \\ V  V /  ___) |_____| |___| |_| | . \\    \\ V  V / |  _ < / ___ \\|  __/|  __/| |___|  _ < 
         |_| \\_/_/\\_\\ /_/   \\_\\_/\\_/  |____/       \\____|____/|_|\\_\\    \\_/\\_/  |_| \\_/_/   \\_|_|   |_|   |_____|_| \\_\\
         
         `;
      context.logger.info(art);
    }),
    concatMap(() => {
      if (options.skipBuild) {
        return of({ success: true });
      }
      return (scheduleTargetAndForget(context, target, {
        watch: false
      }) as unknown) as Observable<BuilderOutput>;
    })
  );
}

function getExecArgv(options: ScullyBuilderOptions) {
  const args = [];
  const keys = Object.keys(options);
  keys.forEach(key => {
    if (
      options[key] !== undefined &&
      key !== 'buildTarget' &&
      key != 'configFiles' &&
      key != 'skipBuild'
    ) {
      // if(typeof(options[key]) == 'boolean') {
      //   args.push(`--${key}`);
      // } else {
      args.push(`--${key}=${options[key]}`);
      // }
    }
  });
  return args;
}
