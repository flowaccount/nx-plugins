import {
  BuilderContext,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget,
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, from, zip } from 'rxjs';
import { concatMap, tap, map, filter, first } from 'rxjs/operators';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';
import {
  ExecutorContext,
  logger,
  parseTargetString,
  readTargetOptions,
  runExecutor,
} from '@nrwl/devkit';

// export function runWaitUntilTargets(
//   waitUntilTargets: string[],
//   context: ExecutorContext
// ): Observable<BuilderOutput> {
//   if (!waitUntilTargets || waitUntilTargets.length === 0)
//     return of({ success: true });
//   return zip(
//     ...waitUntilTargets.map(b => {
//       return scheduleTargetAndForget(context, targetFromTargetString(b)).pipe(
//         filter(e => e.success !== undefined),
//         first()
//       );
//     })
//   ).pipe(
//     map(results => {
//       return { success: !results.some(r => !r.success) };
//     })
//   );
// }

export function runWaitUntilTargets(
  waitUntilTargets: string[],
  context: ExecutorContext
): Promise<{ success: boolean }[]> {
  return Promise.all(
    waitUntilTargets.map(async (waitUntilTarget) => {
      const target = parseTargetString(waitUntilTarget);
      const output = await runExecutor(target, {}, context);
      return new Promise<{ success: boolean }>(async (resolve) => {
        let event = await output.next();
        // Resolve after first event
        resolve(event.value as { success: boolean });

        // Continue iterating
        while (!event.done) {
          event = await output.next();
        }
      });
    })
  );
}

export async function* startBuild(
  options: { buildTarget: string } & JsonObject,
  context: ExecutorContext
) {
  const buildTarget = parseTargetString(options.buildTarget);
  const buildOptions = readTargetOptions<{ buildTarget: string } & JsonObject>(
    buildTarget,
    context
  );
  if (buildOptions.optimization) {
    // logger.warn(stripIndents`
    //         ************************************************
    //         This is a simple process manager for use in
    //         testing or debugging Node applications locally.
    //         DO NOT USE IT FOR PRODUCTION!
    //         You should look into proper means of deploying
    //         your node application to production.
    //         ************************************************`);
  }

  yield* await runExecutor<BuilderOutput>(
    buildTarget,
    {
      watch: options.watch,
    },
    context
  );
}

// export function startBuild(
//   options: { buildTarget: string } & JsonObject,
//   context: ExecutorContext
// ): Observable<BuilderOutput> {
//   const target = targetFromTargetString(options.buildTarget);
//   return from(
//     Promise.all([
//       .getTargetOptions(target),
//       context.getBuilderNameForTarget(target)
//     ]).then(([options, builderName]) =>
//       context.validateOptions(context.target.options, context.target)
//     )
//   ).pipe(
//     tap(options => {
//       logger.info(stripIndents`
//               ************************************************
//               This is a custom wrapper of serverless ${context.builder.builderName}
//               ************************************************`);
//     }),
//     concatMap(
//       () =>
//         (scheduleTargetAndForget(context, target, {
//           watch: false
//         }) as unknown) as Observable<BuilderOutput>
//     )
//   );
// }
