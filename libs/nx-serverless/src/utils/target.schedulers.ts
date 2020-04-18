import {
  BuilderContext,
  BuilderOutput,
  targetFromTargetString,
  scheduleTargetAndForget
} from '@angular-devkit/architect';
import { Observable, of } from 'rxjs';

export function runWaitUntilTargets(
  waitUntilTargets: string[],
  context: BuilderContext
): Observable<BuilderOutput> {
  if (!waitUntilTargets || waitUntilTargets.length === 0)
    return of({ success: true });
  return zip(
    ...options.waitUntilTargets.map(b => {
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
