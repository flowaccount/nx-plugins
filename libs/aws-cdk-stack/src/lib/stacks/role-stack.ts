import { CompositePrincipal, IRole, Role } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { RoleStackProperties } from '../types';

export class RoleStack extends Stack {
  public readonly output: { role: IRole };

  constructor(scope: Construct, id: string, _props: RoleStackProperties) {
    super(scope, id, _props);

    const existingRole: IRole = this.getExistingRole(_props.name);
    if (_props.existingRole || existingRole) {
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

  private getExistingRole(roleName: string): IRole {
    try {
      const role = Role.fromRoleName(this, roleName, roleName, {});
      console.log('Instance role exists:', role.roleName);
      return role;
    } catch (error) {
      console.log('Instance role does not exist:', error.message);
      return null;
    }
  }
}
