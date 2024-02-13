"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineRoleStack = void 0;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
class InlineRoleStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        const policies = [];
        _props.policies.forEach((policyProps) => {
            const _policyStatements = [];
            policyProps.statements.forEach((statement) => {
                const policyStatement = new aws_iam_1.PolicyStatement();
                statement.actions.forEach((_psa) => {
                    policyStatement.addActions(_psa);
                });
                statement.resources.forEach((_psr) => {
                    policyStatement.addResources(_psr);
                });
                _policyStatements.push(policyStatement);
            });
            devkit_1.logger.debug(`initiating policy ${_props.name}`);
            const policy = new aws_iam_1.Policy(this, _props.name, {
                policyName: `${_props.name}-policy`,
                statements: _policyStatements,
            });
            // const policy = (new PolicyStack(scope, `${id}-${policyProps.name}-policy`, {...policyProps})).output.policy
            policies.push(policy);
        });
        devkit_1.logger.debug('creating role');
        const role = new aws_iam_1.Role(this, `${id}-${_props.name}`, {
            roleName: _props.name,
            assumedBy: _props.assumedBy,
        });
        policies.forEach((policy) => {
            devkit_1.logger.debug(`attaching ${policy.policyName} to role`);
            role.attachInlinePolicy(policy);
        });
        this.output = { role: role };
    }
}
exports.InlineRoleStack = InlineRoleStack;
//# sourceMappingURL=inline-role-stack.js.map