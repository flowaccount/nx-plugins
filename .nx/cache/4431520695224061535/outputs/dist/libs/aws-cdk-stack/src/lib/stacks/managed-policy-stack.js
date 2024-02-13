"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagedPolicyStack = void 0;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
class ManagedPolicyStack extends core_1.Stack {
    constructor(scope, id, _props) {
        var _a, _b;
        super(scope, id, _props);
        devkit_1.logger.debug(`start appending resources into policy`);
        if (_props.resourceArns) {
            devkit_1.logger.debug(`start appending resources into statements`);
            (_a = _props.statements) === null || _a === void 0 ? void 0 : _a.forEach((statement) => {
                if (statement.forceResource) {
                    _props.resourceArns.forEach((arn) => {
                        devkit_1.logger.debug(`append ${arn} into policy`);
                        statement.resources.push(arn);
                    });
                }
            });
        }
        const _policyStatements = [];
        (_b = _props.statements) === null || _b === void 0 ? void 0 : _b.forEach((statement) => {
            const policyStatement = new aws_iam_1.PolicyStatement();
            statement.actions.forEach((_psa) => {
                policyStatement.addActions(_psa);
            });
            statement.resources.forEach((_psr) => {
                policyStatement.addResources(_psr);
            });
            _policyStatements.push(policyStatement);
        });
        devkit_1.logger.debug(`creating policy:${_props.name}`);
        const _policy = new aws_iam_1.ManagedPolicy(this, _props.name, {
            managedPolicyName: _props.name,
            statements: _policyStatements,
            roles: _props.roles,
        });
        this.output = { policy: _policy };
    }
}
exports.ManagedPolicyStack = ManagedPolicyStack;
//# sourceMappingURL=managed-policy-stack.js.map