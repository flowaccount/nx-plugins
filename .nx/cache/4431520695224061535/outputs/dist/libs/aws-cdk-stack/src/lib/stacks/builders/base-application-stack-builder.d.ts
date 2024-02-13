import { StackProps } from 'aws-cdk-lib/core';
import { IApplicationStackEnvironmentConfig } from '../../types';
export declare abstract class BaseApplicationStackBuilder {
    protected _applicationConfig: IApplicationStackEnvironmentConfig;
    protected _stage: string;
    protected _stackName: string;
    constructor(_applicationConfig: IApplicationStackEnvironmentConfig);
    abstract BuildStackConfiguration(): StackProps;
}
