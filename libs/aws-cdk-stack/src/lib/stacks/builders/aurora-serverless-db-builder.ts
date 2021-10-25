import { logger } from "@nrwl/devkit";
import { IApplicationStackEnvironmentConfig, InlineRoleStackProperties, LambdaStackConfiguration } from '../../types';
import { BaseApplicationStackBuilder } from "./base-application-stack-builder";
import { QueueProps } from "@aws-cdk/aws-sqs";
import { StackProps } from "@aws-cdk/core";

export class ServerlessApplicationBuilder extends BaseApplicationStackBuilder {

    public executionRole: InlineRoleStackProperties;
    public lambdaFunctions: LambdaStackConfiguration[]
    constructor(
         protected _applicationConfig: IApplicationStackEnvironmentConfig,
         protected _sqsEventSource?: QueueProps[] 
        ) {
        super(_applicationConfig)
        this._sqsEventSource = _sqsEventSource
    }

    BuildStackConfiguration(): StackProps {
        if(!this._applicationConfig.aurora) {
            this._applicationConfig.aurora = {
                securityGroupIds: ['sg-00270d06c7561fd05'],
                isProduction: this._applicationConfig._isProduction,
                username: 'dev_dbmaster', 
                password: 'devdb001!' 
            }
        }
        return this._applicationConfig.aurora
    }
}