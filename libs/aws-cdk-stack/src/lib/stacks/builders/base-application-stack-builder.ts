import { StackProps } from '@aws-cdk/core';
import { logger } from '@nx/devkit';
import { IApplicationStackEnvironmentConfig } from '../../types';

export abstract class BaseApplicationStackBuilder {
  protected _stage: string;
  protected _stackName: string;

  constructor(
    protected _applicationConfig: IApplicationStackEnvironmentConfig
  ) {}

  abstract BuildStackConfiguration(): StackProps;
}
