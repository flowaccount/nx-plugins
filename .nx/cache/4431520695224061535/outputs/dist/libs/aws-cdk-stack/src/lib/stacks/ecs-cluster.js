"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECSCluster = void 0;
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
class ECSCluster extends core_1.Stack {
    constructor(scope, id, stackProps) {
        super(scope, id, stackProps);
        devkit_1.logger.info('creating the ecs cluster');
        if (stackProps.ecs.existingCluster) {
            aws_ecs_1.Cluster.fromClusterAttributes(this, stackProps.ecs.clusterName, {
                vpc: stackProps.vpc,
                clusterName: stackProps.ecs.clusterName,
                securityGroups: [],
            });
        }
        else {
            this.cluster = new aws_ecs_1.Cluster(this, stackProps.ecs.clusterName, {
                vpc: stackProps.vpc,
                clusterName: stackProps.ecs.clusterName,
                containerInsights: false,
            });
        }
        stackProps.taglist.forEach((tag) => {
            core_1.Tags.of(this).add(tag.key, tag.value);
        });
    }
}
exports.ECSCluster = ECSCluster;
//# sourceMappingURL=ecs-cluster.js.map