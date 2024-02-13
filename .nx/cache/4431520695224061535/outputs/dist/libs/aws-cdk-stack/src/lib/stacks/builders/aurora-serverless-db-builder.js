"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerlessApplicationBuilder = void 0;
const base_application_stack_builder_1 = require("./base-application-stack-builder");
class ServerlessApplicationBuilder extends base_application_stack_builder_1.BaseApplicationStackBuilder {
    constructor(_applicationConfig, _sqsEventSource) {
        super(_applicationConfig);
        this._applicationConfig = _applicationConfig;
        this._sqsEventSource = _sqsEventSource;
        this._sqsEventSource = _sqsEventSource;
    }
    BuildStackConfiguration() {
        if (!this._applicationConfig.aurora) {
            this._applicationConfig.aurora = {
                securityGroupIds: ['sg-00270d06c7561fd05'],
                isProduction: this._applicationConfig._isProduction,
                username: 'dev_dbmaster',
                password: 'devdb001!',
            };
        }
        return this._applicationConfig.aurora;
    }
}
exports.ServerlessApplicationBuilder = ServerlessApplicationBuilder;
//# sourceMappingURL=aurora-serverless-db-builder.js.map