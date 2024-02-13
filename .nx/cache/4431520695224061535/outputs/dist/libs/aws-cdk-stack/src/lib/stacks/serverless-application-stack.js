"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerlessApplicationStack = void 0;
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
const lambda_stack_1 = require("./lambda-stack");
class ServerlessApplicationStack extends core_1.NestedStack {
    constructor(scope, id, _props) {
        var _a;
        super(scope, id, _props);
        devkit_1.logger.info('Start Serverless Application Deployment Initiation');
        const lambdaStack = new lambda_stack_1.TypescriptLambdaStack(scope, `${id}-serverless-typescript-lambda`, {
            vpc: _props.vpc,
            subnets: _props.subnets,
            functions: _props.lambda,
            role: _props.role,
        });
        devkit_1.logger.info('Serverless Application Deployment Initiation Done!');
        (_a = lambdaStack.output.lambdaFunctions) === null || _a === void 0 ? void 0 : _a.forEach((l) => {
            devkit_1.logger.info(`Initiated Lambda Function--> ${l.functionName}`);
        });
        devkit_1.logger.info(`Initiated Role -->  ${_props.role.roleName}`);
        devkit_1.logger.info('🥳👆');
    }
}
exports.ServerlessApplicationStack = ServerlessApplicationStack;
//# sourceMappingURL=serverless-application-stack.js.map