import { CompositePrincipal, IRole, Role } from 'aws-cdk-lib/aws-iam';
import { Stack, Tags } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { logger } from '@nx/devkit';
import { RoleStackProperties, TagModel } from '../types';

export interface RoleStackProps extends RoleStackProperties {
  readonly taglist?: TagModel[];
}

export class RoleStack extends Stack {
  public readonly output: { role: IRole };

  constructor(scope: Construct, id: string, stackProps: RoleStackProps) {
    super(scope, id, stackProps);

    if (stackProps.existingRole) {
      const existingRole: IRole = Role.fromRoleName(
        this,
        stackProps.name,
        stackProps.name,
        {}
      );
      existingRole;
      this.output = { role: existingRole };
    } else {
      logger.debug(`creating role -- ${stackProps.name}`);
      const newRole = new Role(this, `${stackProps.name}`, {
        roleName: stackProps.name,
        assumedBy: new CompositePrincipal(...stackProps.assumedBy),
      });
      this.output = { role: newRole };
    }

    const taglist: TagModel[] = stackProps.taglist ?? [];
    taglist.forEach((tag) => {
      Tags.of(this).add(tag.key, tag.value);
    });
  }
}
