import { CompositePrincipal, IRole, Role } from '@aws-cdk/aws-iam';
import { Construct, Stack } from '@aws-cdk/core';
import { logger } from '@nrwl/devkit';
import { RoleStackProperties } from '../types';

export class RoleStack extends Stack {
  public readonly output: { role: IRole };

  constructor(scope: Construct, id: string, _props: RoleStackProperties) {
    super(scope, id, _props);

    logger.debug(`creating role -- ${_props.name}`);
    const role = new Role(this, `${_props.name}`, {
      roleName: _props.name,
      assumedBy: new CompositePrincipal(..._props.assumedBy)
    });

    this.output = { role: role };
  }
}
