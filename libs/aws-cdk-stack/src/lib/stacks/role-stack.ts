import { IRole, Role } from "@aws-cdk/aws-iam";
import { Construct, Stack } from "@aws-cdk/core";
import { logger } from "@nrwl/devkit";
import { RoleStackProperties } from "../types";


export class RoleStack extends Stack {
    public readonly output: { role: IRole };

        constructor(scope: Construct, id: string, _props: RoleStackProperties) {
         super(scope, id, _props);
          
          logger.debug("creating role")
          const role = new Role(this, `${id}-${_props.name}`, {
              roleName: _props.name,
              assumedBy: _props.assumedBy
          })
          
          this.output = { role: role };
        }
}