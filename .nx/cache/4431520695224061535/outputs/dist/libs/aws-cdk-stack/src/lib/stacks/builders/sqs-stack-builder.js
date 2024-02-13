"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsStackBuilder = void 0;
const base_application_stack_builder_1 = require("./base-application-stack-builder");
const core_1 = require("aws-cdk-lib/core");
class SqsStackBuilder extends base_application_stack_builder_1.BaseApplicationStackBuilder {
    constructor(_applicationConfig, configOptions) {
        super(_applicationConfig);
        this._applicationConfig = _applicationConfig;
        this.configOptions = configOptions;
    }
    BuildSqsStack() {
        if (!this._applicationConfig.sqs) {
            this._applicationConfig.sqs = [
                {
                    queueName: `${this._stage}-${this.configOptions.queueName}`,
                    visibilityTimeout: core_1.Duration.seconds(this.configOptions.visibilityTimeout),
                },
            ];
        }
        return this._applicationConfig.sqs[0];
    }
    BuildStackConfiguration() {
        return null;
    }
}
exports.SqsStackBuilder = SqsStackBuilder;
//# sourceMappingURL=sqs-stack-builder.js.map