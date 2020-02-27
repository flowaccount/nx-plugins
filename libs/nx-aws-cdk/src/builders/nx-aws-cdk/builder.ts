import {
  BuilderContext,
  BuilderOutput,
  createBuilder
} from '@angular-devkit/architect';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NxAwsCdkBuilderSchema } from './schema';

export function runBuilder(
  options: NxAwsCdkBuilderSchema,
  context: BuilderContext
): Observable<BuilderOutput> {
  return of({ success: true }).pipe(
    tap(() => {
      context.logger.info('Builder ran for nx-aws-cdk');
    })
  );
}

export default createBuilder(runBuilder);
