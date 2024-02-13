import { IApplicationStackEnvironmentConfig, InlineRoleStackProperties, LambdaStackConfiguration } from '../../types';
import { BaseApplicationStackBuilder } from './base-application-stack-builder';
import { QueueProps } from 'aws-cdk-lib/aws-sqs';
import { StackProps } from 'aws-cdk-lib/core';
export declare class ServerlessApplicationBuilder extends BaseApplicationStackBuilder {
    protected _applicationConfig: IApplicationStackEnvironmentConfig;
    protected _sqsEventSource?: QueueProps[];
    executionRole: InlineRoleStackProperties;
    lambdaFunctions: LambdaStackConfiguration[];
    constructor(_applicationConfig: IApplicationStackEnvironmentConfig, _sqsEventSource?: QueueProps[]);
    BuildStackConfiguration(): StackProps;
}
