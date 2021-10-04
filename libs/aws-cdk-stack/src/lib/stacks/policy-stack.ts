import { Policy, PolicyStatement } from '@aws-cdk/aws-iam';
import { Construct, Stack } from '@aws-cdk/core';
import { logger } from '@nrwl/devkit';
import { PolicyStackProperties } from '../types';

export class PolicyStack extends Stack {
  public readonly output: {
    policy: Policy;
  };
  constructor(scope: Construct, id: string, _props: PolicyStackProperties) {
    super(scope, id, _props);
    const _policyStatements: PolicyStatement[] = [];
    _props.statements.forEach((statement) => {
      const policyStatement = new PolicyStatement();
      statement.actions.forEach((_psa: string) => {
        policyStatement.addActions(_psa);
      });
      statement.resources.forEach((_psr: string) => {
        policyStatement.addResources(_psr);
      });
      _policyStatements.push(policyStatement);
    });
    logger.debug(`creating policy:${_props.name}:`);
    const _policy = new Policy(this, _props.name, {
      policyName: _props.name,
      statements: _policyStatements,
      roles: _props.roles,
    });
    this.output = { policy: _policy };
  }
}
