import { ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core'; import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { PolicyStackProperties } from '../types';

export class ManagedPolicyStack extends Stack {
  public readonly output: {
    policy: ManagedPolicy;
  };
  constructor(scope: Construct, id: string, _props: PolicyStackProperties) {
    super(scope, id, _props);

    logger.debug(`start appending resources into policy`);
    if (_props.resourceArns) {
      logger.debug(`start appending resources into statements`);
      _props.statements?.forEach((statement) => {
        if (statement.forceResource) {
          _props.resourceArns.forEach((arn) => {
            logger.debug(`append ${arn} into policy`);
            statement.resources.push(arn);
          });
        }
      });
    }
    const _policyStatements: PolicyStatement[] = [];
    _props.statements?.forEach((statement) => {
      const policyStatement = new PolicyStatement();
      statement.actions.forEach((_psa: string) => {
        policyStatement.addActions(_psa);
      });
      statement.resources.forEach((_psr: string) => {
        policyStatement.addResources(_psr);
      });
      _policyStatements.push(policyStatement);
    });
    logger.debug(`creating policy:${_props.name}`);
    const _policy = new ManagedPolicy(this, _props.name, {
      managedPolicyName: _props.name,
      statements: _policyStatements,
      roles: _props.roles,
    });
    this.output = { policy: _policy };
  }
}
