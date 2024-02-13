"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3MountConfig = exports.TagModel = exports.ECSServiceModel = exports.ECSModel = exports.PolicyModel = exports.AutoScalingGroupModel = exports.RoleModel = exports.ECSStackEnvironmentConfig = exports.Tag = exports.EsInstanceType = void 0;
;
var EsInstanceType;
(function (EsInstanceType) {
    EsInstanceType["Small"] = "t3.small.elasticsearch";
    EsInstanceType["Medium"] = "t3.medium.elasticsearch";
    EsInstanceType["Large"] = "r5.large.elasticsearch";
    EsInstanceType["Xlarge"] = "r5.xlarge.elasticsearch";
})(EsInstanceType || (exports.EsInstanceType = EsInstanceType = {}));
class Tag {
}
exports.Tag = Tag;
class ECSStackEnvironmentConfig {
}
exports.ECSStackEnvironmentConfig = ECSStackEnvironmentConfig;
ECSStackEnvironmentConfig.token = Symbol("IECSStackEnvironmentConfig");
class RoleModel {
}
exports.RoleModel = RoleModel;
class AutoScalingGroupModel {
}
exports.AutoScalingGroupModel = AutoScalingGroupModel;
class SecurityGroupsInboudRuleModel {
}
class SecurityGroupsModel {
}
class PolicyStatementModel {
}
class PolicyModel {
}
exports.PolicyModel = PolicyModel;
class ECSModel {
}
exports.ECSModel = ECSModel;
class ECSServiceModel {
}
exports.ECSServiceModel = ECSServiceModel;
class ScalingSchduleModel {
}
class TaskDefinitionModel {
}
// class EnvironmentModel{
//   [name: string]: string | boolean | number
// }
class TagModel {
}
exports.TagModel = TagModel;
class S3MountConfig {
}
exports.S3MountConfig = S3MountConfig;
/* End of ECS Models */
//# sourceMappingURL=index.js.map