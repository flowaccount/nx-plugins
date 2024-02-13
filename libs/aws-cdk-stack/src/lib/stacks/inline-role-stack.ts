import { IRole, Policy, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { InlineRoleStackProperties } from '../types';

export class InlineRoleStack extends Stack {
  public readonly output: { role: IRole };

  constructor(scope: Construct, id: string, _props: InlineRoleStackProperties) {
    super(scope, id, _props);
    const policies: Policy[] = [];
    _props.policies.forEach((policyProps) => {
      const _policyStatements: PolicyStatement[] = [];
      policyProps.statements.forEach((statement) => {
        const policyStatement = new PolicyStatement();
        statement.actions.forEach((_psa: string) => {
          policyStatement.addActions(_psa);
        });
        statement.resources.forEach((_psr: string) => {
          policyStatement.addResources(_psr);
        });
        _policyStatements.push(policyStatement);
      });
      logger.debug(`initiating policy ${_props.name}`);
      const policy = new Policy(this, _props.name, {
        policyName: `${_props.name}-policy`,
        statements: _policyStatements,
      });
      // const policy = (new PolicyStack(scope, `${id}-${policyProps.name}-policy`, {...policyProps})).output.policy
      policies.push(policy);
    });

    logger.debug('creating role');
    const role = new Role(this, `${id}-${_props.name}`, {
      roleName: _props.name,
      assumedBy: _props.assumedBy,
    });
    policies.forEach((policy) => {
      logger.debug(`attaching ${policy.policyName} to role`);
      role.attachInlinePolicy(policy);
    });

    this.output = { role: role };
  }
}
