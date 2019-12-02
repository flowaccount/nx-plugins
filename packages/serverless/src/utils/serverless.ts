import * as Serverless from 'serverless/lib/Serverless';
import { BuildBuilderOptions } from './types';
import { targetFromTargetString, BuilderContext } from '@angular-devkit/architect';
import { from } from 'rxjs/internal/observable/from';
import { map, merge, switchMap, tap, mergeMap } from 'rxjs/operators';
import { ServerlessDeployBuilderOptions } from '../builders/deploy/deploy.impl';
import { BuildServerlessBuilderOptions } from '../builders/build/build.impl';
import { of, Observable } from 'rxjs';

export class ServerlessWrapper {

    constructor() {
    }

    private static serverless$: any = null;

    static get serverless() {
        if (this.serverless$ === null) {
            throw new Error("Please initialize serverless before usage, or pass option for initialization.")
        }
        return this.serverless$
    }

    static isServerlessDeployBuilderOptions(arg: any): arg is ServerlessDeployBuilderOptions {
        return arg.buildTarget !== undefined;
    }

    static init<T extends BuildBuilderOptions>(options: T, context: BuilderContext): Observable<any> {
        
        if (this.serverless$ === null) {
            return from(Promise.resolve(options)).pipe(
            mergeMap((options: T) => {
                if (ServerlessWrapper.isServerlessDeployBuilderOptions(options)) {
                    const target = targetFromTargetString(options.buildTarget);
                    return from(Promise.all([
                            context.getTargetOptions(target),
                            context.getBuilderNameForTarget(target)
                        ]).then(([options, builderName]) => {
                            context.validateOptions(options, builderName)
                            return options;
                        }
                    ))
                }
                else {
                    return of(options)
                }
            }
            ),
            tap((options: T) => {
                this.serverless$ = new Serverless({ config: options.serverlessConfig, servicePath: options.servicePath });
                this.serverless$.init()
                this.serverless$.cli.asciiGreeting()
            }))
        } else { return of(null); }
    }

}


