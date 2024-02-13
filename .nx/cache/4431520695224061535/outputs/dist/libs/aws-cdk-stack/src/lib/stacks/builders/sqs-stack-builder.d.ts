import { IApplicationStackEnvironmentConfig, SqsConfigurationBuilderOption } from '../../types';
import { BaseApplicationStackBuilder } from './base-application-stack-builder';
import { QueueProps } from 'aws-cdk-lib/aws-sqs';
import { StackProps } from 'aws-cdk-lib/core';
export declare class SqsStackBuilder extends BaseApplicationStackBuilder {
    protected _applicationConfig: IApplicationStackEnvironmentConfig;
    protected configOptions?: SqsConfigurationBuilderOption;
    constructor(_applicationConfig: IApplicationStackEnvironmentConfig, configOptions?: SqsConfigurationBuilderOption);
    BuildSqsStack(): QueueProps;
    BuildStackConfiguration(): StackProps;
}
