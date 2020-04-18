import {
  BuilderContext,
  createBuilder,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget,
  BuilderRun
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, from, zip, concat } from 'rxjs';
import { concatMap, tap, map, filter, first } from 'rxjs/operators';

//   main: string;
//   tsConfig: string;
//   outputPath: string;
//   watch: boolean;
//   sourceMap: boolean;
//   assets: Array<AssetGlob | string>;
//   packageJson: string;
export interface AwsCdkDeployOptions extends JsonObject {
  waitUntilTargets: string[];
  main: string;
  tsConfig: string;
  outputPath: string;
  // assets: Array<AssetGlob | string>;
  stackName: string;
  list: boolean;
  verbose?: boolean;
  sourceRoot?: string;
  buildTarget: string;
  root?: string;
  processEnvironmentFile: string;
}

export default createBuilder<AwsCdkDeployOptions & JsonObject>(cdkDeployRunner);
export function cdkDeployRunner(
  options: JsonObject & AwsCdkDeployOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  //
  return runWaitUntilTargetsSequentially(options, context).pipe(
    concatMap(v => {
      if (!v.success) {
        context.logger.error(
          'One of the tasks specified in waitUntilTargets failed'
        );
        return of({ success: false });
      }
      return context.scheduleBuilder('@nrwl/workspace:run-commands', {
        commands: [
          {
            command:
              'cdk -o=cdk.marketing.out --app "npx ts-node -r dotenv/config marketing/bin/cdk.ts dotenv_config_path=environment-variables/.env-marketing"'
          }
        ],
        cwd: options.root,
        parallel: false
      });
    }),
    concatMap((result: BuilderRun) => {
      return result.output;
    })
  );
}

function runWaitUntilTargetsSequentially(
  options: AwsCdkDeployOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  if (!options.waitUntilTargets || options.waitUntilTargets.length === 0)
    return of({ success: true });
  const scheduledTargets: Observable<
    BuilderOutput
  >[] = options.waitUntilTargets.map(target =>
    scheduleTargetAndForget(context, targetFromTargetString(target), {})
  );
  concat(scheduledTargets).pipe(
    map(result => {
      return result;
    })
  );
  //   return of({ success: true})
  // return zip(
  //   ...options.waitUntilTargets.map(b => {
  //     return scheduleTargetAndForget(context, targetFromTargetString(b)).pipe(
  //       filter(e => e.success !== undefined),
  //       first()
  //     );
  //   })
  // ).pipe(
  //   map(results => {
  //     return { success: !results.some(r => !r.success) };
  //   })
  // );
}

export function startBuild(
  options: AwsCdkDeployOptions,
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
    tap(options => {
      if (options.optimization) {
        const art = `
        _   ___  __     ___        ______         ____ ____  _  __ __        ______     _    ____  ____  _____ ____  
       | \\ | \\ \\/ /    / \\ \\      / / ___|       / ___|  _ \\| |/ / \\ \\      / |  _ \\   / \\  |  _ \\|  _ \\| ____|  _ \\ 
       |  \\| |\\  /    / _ \\ \\ /\\ / /\\___ \\ _____| |   | | | | ' /   \\ \\ /\\ / /| |_) | / _ \\ | |_) | |_) |  _| | |_) |
       | |\\  |/  \\   / ___ \\ V  V /  ___) |_____| |___| |_| | . \\    \\ V  V / |  _ < / ___ \\|  __/|  __/| |___|  _ < 
       |_| \\_/_/\\_\\ /_/   \\_\\_/\\_/  |____/       \\____|____/|_|\\_\\    \\_/\\_/  |_| \\_/_/   \\_|_|   |_|   |_____|_| \\_\\`;
        context.logger.info(art);
      }
    }),
    concatMap(
      () =>
        (scheduleTargetAndForget(context, target, {
          watch: false
        }) as unknown) as Observable<BuilderOutput>
    )
  );
}

function getExecArgv(options: AwsCdkDeployOptions) {
  const args = [];
  if (options.function && options.function != '') {
    args.push('function');
  }
  if (options.list) {
    args.push('list');
  }
  for (const key in options) {
    if (options.hasOwnProperty(key)) {
      if (options[key] !== undefined) {
        args.push(`--${key} ${options[key]}`);
      }
    }
  }

  return args;
}
