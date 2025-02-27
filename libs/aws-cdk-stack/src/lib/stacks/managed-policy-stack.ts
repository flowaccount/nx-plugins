import { ManagedPolicy, PolicyStatement, IRole } from 'aws-cdk-lib/aws-iam';
import { Stack, Tags } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { PolicyStackProperties, TagModel } from '../types';

export interface PolicyStackProps extends PolicyStackProperties {
  readonly taglist?: TagModel[];
}

export class ManagedPolicyStack extends Stack {
  public readonly output: {
    policy: ManagedPolicy;
  };

  constructor(scope: Construct, id: string, stackProps: PolicyStackProps) {
    super(scope, id, stackProps);

    logger.debug(`start appending resources into policy`);
    if (stackProps.resourceArns) {
      logger.debug(`start appending resources into statements`);
      stackProps.statements?.forEach((statement) => {
        if (statement.forceResource) {
          stackProps.resourceArns.forEach((arn) => {
            logger.debug(`append ${arn} into policy`);
            statement.resources.push(arn);
          });
        }
      });
    }

    const _policyStatements: PolicyStatement[] = [];
    stackProps.statements?.forEach((statement) => {
      const policyStatement = new PolicyStatement();
      statement.actions.forEach((_psa: string) => {
        policyStatement.addActions(_psa);
      });
      statement.resources.forEach((_psr: string) => {
        policyStatement.addResources(_psr);
      });
      _policyStatements.push(policyStatement);
    });

    logger.debug(`creating policy:${stackProps.name}`);
    const _policy = new ManagedPolicy(this, stackProps.name, {
      managedPolicyName: stackProps.name,
      statements: _policyStatements,
    });

    logger.debug(`attach policy to roles`);
    stackProps.roles?.forEach((role: IRole) => {
      _policy.attachToRole(role);
    });

    this.output = { policy: _policy };

    const taglist: TagModel[] = stackProps.taglist ?? [];
    taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
