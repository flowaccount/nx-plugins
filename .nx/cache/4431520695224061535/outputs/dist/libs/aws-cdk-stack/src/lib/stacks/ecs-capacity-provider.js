"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECSCapacityProvider = void 0;
const aws_ecs_1 = require("aws-cdk-lib/aws-ecs");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
class ECSCapacityProvider extends core_1.Stack {
    constructor(scope, id, stackProps) {
        super(scope, id, stackProps);
        devkit_1.logger.info('creating the ecs cluster');
        console.log(`=====================================================${stackProps.ecs.providerList}`),
            (this.thisClusterCapacityProviderAssociations =
                new aws_ecs_1.CfnClusterCapacityProviderAssociations(this, `${stackProps.ecs.clusterName}-act`, {
                    capacityProviders: stackProps.ecs.providerList,
                    cluster: stackProps.ecs.clusterName,
                    defaultCapacityProviderStrategy: [
                        {
                            capacityProvider: `${stackProps.ecs.clusterName}-default`,
                            base: 0,
                            weight: 1,
                        },
                    ],
                }));
        stackProps.taglist.forEach((tag) => {
            core_1.Tags.of(this).add(tag.key, tag.value);
        });
    }
}
exports.ECSCapacityProvider = ECSCapacityProvider;
//# sourceMappingURL=ecs-capacity-provider.js.map