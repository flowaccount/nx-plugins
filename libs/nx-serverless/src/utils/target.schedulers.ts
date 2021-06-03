import {
  BuilderContext,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';
import { Observable, of, from, zip } from 'rxjs';
import { concatMap, tap, map, filter, first } from 'rxjs/operators';
import { stripIndents } from '@angular-devkit/core/src/utils/literals';

export function runWaitUntilTargets(
  waitUntilTargets: string[],
  context: BuilderContext
): Observable<BuilderOutput> {
  if (!waitUntilTargets || waitUntilTargets.length === 0)
    return of({ success: true });
  return zip(
    ...waitUntilTargets.map(b => {
      return scheduleTargetAndForget(context, targetFromTargetString(b)).pipe(
        filter(e => e.success !== undefined),
        first()
      );
    })
  ).pipe(
    map(results => {
      return { success: !results.some(r => !r.success) };
    })
  );
}

export function startBuild(
  options: { buildTarget: string } & JsonObject,
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
      context.logger.info(stripIndents`
              ************************************************
              This is a custom wrapper of serverless ${context.builder.builderName}
              ************************************************`);
    }),
    concatMap(
      () =>
        (scheduleTargetAndForget(context, target, {
          watch: false
        }) as unknown) as Observable<BuilderOutput>
    )
  );
}
