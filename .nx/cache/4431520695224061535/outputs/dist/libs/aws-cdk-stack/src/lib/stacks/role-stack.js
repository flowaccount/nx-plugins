"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleStack = void 0;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
class RoleStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        devkit_1.logger.debug(`creating role -- ${_props.name}`);
        const role = new aws_iam_1.Role(this, `${_props.name}`, {
            roleName: _props.name,
            assumedBy: new aws_iam_1.CompositePrincipal(..._props.assumedBy),
        });
        this.output = { role: role };
    }
}
exports.RoleStack = RoleStack;
//# sourceMappingURL=role-stack.js.map