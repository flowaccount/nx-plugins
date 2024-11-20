import { CompositePrincipal, IRole, Role } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { RoleStackProperties } from '../types';

export class RoleStack extends Stack {
  public readonly output: { role: IRole };

  constructor(scope: Construct, id: string, _props: RoleStackProperties) {
    super(scope, id, _props);

    if (_props.existingRole) {
      const existingRole: IRole = Role.fromRoleName(
        this,
        _props.name,
        _props.name,
        {}
      );
      existingRole;
      this.output = { role: existingRole };
    } else {
      logger.debug(`creating role -- ${_props.name}`);
      const newRole = new Role(this, `${_props.name}`, {
        roleName: _props.name,
        assumedBy: new CompositePrincipal(..._props.assumedBy),
      });
      this.output = { role: newRole };
    }
  }
}
