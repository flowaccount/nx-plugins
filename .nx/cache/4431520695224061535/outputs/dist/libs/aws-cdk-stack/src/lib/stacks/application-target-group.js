"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationTargetGroupStack = void 0;
const core_1 = require("aws-cdk-lib/core");
const aws_elasticloadbalancingv2_1 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const devkit_1 = require("@nx/devkit");
class ApplicationTargetGroupStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        if (!_props.applicationtargetGroupProps.targetGroupName) {
            devkit_1.logger.warn('loadbalancer name is not set!');
            _props.applicationtargetGroupProps = Object.assign(Object.assign({}, _props.applicationtargetGroupProps), { targetGroupName: Math.random().toString(36).substring(2, 5) });
        }
        this.tg = new aws_elasticloadbalancingv2_1.ApplicationTargetGroup(this, `tg-${_props.applicationtargetGroupProps.targetGroupName}`, _props.applicationtargetGroupProps);
        const applicationListenerRule = new aws_elasticloadbalancingv2_1.ApplicationListenerRule(this, `${_props.apiDomain}-listener-rule`, {
            listener: _props.albListener,
            priority: 1,
            conditions: [aws_elasticloadbalancingv2_1.ListenerCondition.hostHeaders([_props.apiDomain])],
            targetGroups: [this.tg],
        });
    }
}
exports.ApplicationTargetGroupStack = ApplicationTargetGroupStack;
//# sourceMappingURL=application-target-group.js.map