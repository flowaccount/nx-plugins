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
import { startBuild } from '../../utils/target.schedulers';

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
