import { logger } from '@nx/devkit';
import {
  IApplicationStackEnvironmentConfig,
  SqsConfigurationBuilderOption,
} from '../../types';
import { BaseApplicationStackBuilder } from './base-application-stack-builder';
import { QueueProps } from 'aws-cdk-lib/aws-sqs';
import { Duration, StackProps } from 'aws-cdk-lib/core';

export class SqsStackBuilder extends BaseApplicationStackBuilder {
  constructor(
    protected _applicationConfig: IApplicationStackEnvironmentConfig,
    protected configOptions?: SqsConfigurationBuilderOption
  ) {
    super(_applicationConfig);
  }

  BuildSqsStack(): QueueProps {
    if (!this._applicationConfig.sqs) {
      this._applicationConfig.sqs = [
        {
          queueName: `${this._stage}-${this.configOptions.queueName}`,
          visibilityTimeout: Duration.seconds(
            this.configOptions.visibilityTimeout
          ),
        },
      ];
    }
    return this._applicationConfig.sqs[0];
  }

  BuildStackConfiguration(): StackProps {
    return null;
  }
}
