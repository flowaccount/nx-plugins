import { ServerlessBaseOptions } from './types';
import { BuilderContext } from '@angular-devkit/architect';
import { Observable } from 'rxjs';
import { ServerlessDeployBuilderOptions } from '../builders/deploy/deploy.impl';
export declare class ServerlessWrapper {
    constructor();
    private static serverless$;
    static get serverless(): any;
    static isServerlessDeployBuilderOptions(arg: any): arg is ServerlessDeployBuilderOptions;
    static init<T extends ServerlessBaseOptions>(options: T, context: BuilderContext): Observable<void>;
}
