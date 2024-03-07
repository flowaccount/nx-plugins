import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
  runExecutor,
} from '@nx/devkit';
import { SimpleBuildEvent } from './types';

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
      const target = parseTargetString(waitUntilTarget, context);
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

// export function runWaitUntilTargets(
//   waitUntilTargets: string[],
//   context: ExecutorContext
// ): Promise<{ success: boolean }[]> {
//   return Promise.all(
//     waitUntilTargets.map(async (waitUntilTarget) => {
//       const target = parseTargetString(waitUntilTarget);
      
//       const output = await runExecutor(target, {}, context);
//       return new Promise<{ success: boolean }>(async (resolve) => {
//         let event = await output.next();
//         // Resolve after first event
//         resolve(event.value as { success: boolean });
//         // Continue iterating
//         while (!event.done) {
//           event = await output.next();
//         }
//       });
//     })
//   );
// }

export async function* startBuild(
  options: { buildTarget: string; watch: boolean },
  context: ExecutorContext
) {
  const buildTarget = parseTargetString(options.buildTarget, context);
  const buildOptions = readTargetOptions<{
    buildTarget: string;
    optimization: boolean;
  }>(buildTarget, context);
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

  yield* await runExecutor<SimpleBuildEvent>(
    buildTarget,
    {
      watch: options.watch,
    },
    context
  );
}
