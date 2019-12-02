import { BuildBuilderOptions } from './types';
import { BuilderContext } from '@angular-devkit/architect';
import { ServerlessDeployBuilderOptions } from '../builders/deploy/deploy.impl';
import { Observable } from 'rxjs';
export declare class ServerlessWrapper {
    constructor();
    private static serverless$;
    static readonly serverless: any;
    static isServerlessDeployBuilderOptions(arg: any): arg is ServerlessDeployBuilderOptions;
    static init<T extends BuildBuilderOptions>(options: T, context: BuilderContext): Observable<any>;
}
