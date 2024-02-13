"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyStack = void 0;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
class PolicyStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        const _policyStatements = [];
        _props.statements.forEach((statement) => {
            const policyStatement = new aws_iam_1.PolicyStatement();
            statement.actions.forEach((_psa) => {
                policyStatement.addActions(_psa);
            });
            statement.resources.forEach((_psr) => {
                policyStatement.addResources(_psr);
            });
            _policyStatements.push(policyStatement);
        });
        devkit_1.logger.debug(`creating policy:${_props.name}:`);
        const _policy = new aws_iam_1.Policy(this, _props.name, {
            policyName: _props.name,
            statements: _policyStatements,
            roles: _props.roles,
        });
        this.output = { policy: _policy };
    }
}
exports.PolicyStack = PolicyStack;
//# sourceMappingURL=policy-stack.js.map