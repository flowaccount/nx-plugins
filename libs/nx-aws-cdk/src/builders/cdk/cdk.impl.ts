import {
  BuilderContext,
  BuilderOutput,
  BuilderRun,
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, from, concat } from 'rxjs';
import { concatMap, tap, map } from 'rxjs/operators';

export interface AwsCdkOptions extends JsonObject {
  waitUntilTargets: string[];
  buildTarget: string;
  skipBuild: boolean;
  main: string;
  tsConfig: string;
  outputFile: string;
  command: string;
  stackNames: string[];
  processEnvironmentFile: string;
  verbose?: boolean;
}
export function cdkCmdRunner(
  options: JsonObject & AwsCdkOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  //
  if (options.skipBuild) {
    return runWaitUntilTargetsSequentially(options, context).pipe(
      concatMap((v) => {
        if (!v.success) {
          context.logger.error(
            'One of the tasks specified in waitUntilTargets failed'
          );
          return of({ success: false });
        }
        return runCdk(options, context);
      }),
      concatMap((result: BuilderRun) => {
        return result.output;
      })
    );
  } else {
    return runWaitUntilTargetsSequentially(options, context).pipe(
      concatMap((v) => {
        if (!v.success) {
          context.logger.error(
            'One of the tasks specified in waitUntilTargets failed'
          );
          return of({ success: false });
        }
        return startBuild(options, context);
      }),
      concatMap((v) => {
        if (!v.success) {
          context.logger.error('Build target failed!');
          return of({ success: false });
        }
        return runCdk(options, context);
      }),
      concatMap((result: BuilderRun) => {
        return result.output;
      })
    );
  }
}

function runCdk(
  options: AwsCdkOptions,
  context: BuilderContext
): Observable<BuilderRun> {
  const commands: { command: string }[] = [];
  // options.configFiles.forEach(fileName => {
  commands.push({
    command: `cdk --o=${
      options.outputFile
    } --app "npx ts-node -r dotenv/config ${options.main} dotenv_config_path=${
      options.processEnvironmentFile
    }" ${options.command} ${options.stackNames.join(' ')}`,
  });
  // });
  return from(
    context.scheduleBuilder('@nrwl/workspace:run-commands', {
      commands: commands,
      cwd: options.root,
      color: true,
      parallel: false,
    })
  );
}

//   return runWaitUntilTargetsSequentially(options, context).pipe(
//     concatMap(v => {
//       if (!v.success) {
//         context.logger.error(
//           'One of the tasks specified in waitUntilTargets failed'
//         );
//         return of({ success: false });
//       }
//       return context.scheduleBuilder('@nrwl/workspace:run-commands', {
//         commands: [
//           {
//             command:
//               'cdk -o=cdk.marketing.out --app "npx ts-node -r dotenv/config marketing/bin/cdk.ts dotenv_config_path=environment-variables/.env-marketing"'
//           }
//         ],
//         cwd: options.root,
//         parallel: false
//       });
//     }),
//     concatMap((result: BuilderRun) => {
//       return result.output;
//     })
//   );
// }

function runWaitUntilTargetsSequentially(
  options: AwsCdkOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  if (!options.waitUntilTargets || options.waitUntilTargets.length === 0)
    return of({ success: true });
  const scheduledTargets: Observable<BuilderOutput>[] = options.waitUntilTargets.map(
    (target) =>
      scheduleTargetAndForget(context, targetFromTargetString(target), {})
  );
  concat(scheduledTargets).pipe(
    map((result) => {
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
  options: AwsCdkOptions,
  context: BuilderContext
): Observable<BuilderOutput> {
  const target = targetFromTargetString(options.buildTarget);
  return from(
    Promise.all([
      context.getTargetOptions(target),
      context.getBuilderNameForTarget(target),
    ]).then(([options, builderName]) =>
      context.validateOptions(options, builderName)
    )
  ).pipe(
    tap((options) => {
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
          watch: false,
        }) as unknown) as Observable<BuilderOutput>
    )
  );
}

export default cdkCmdRunner;
