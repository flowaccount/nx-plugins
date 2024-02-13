"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQSStack = void 0;
const cdk = require("aws-cdk-lib/core");
const sqs = require("aws-cdk-lib/aws-sqs");
const devkit_1 = require("@nx/devkit");
// import { PrincipalWithConditions } from "aws-cdk-lib/aws-iam";
//import firehose = require("aws-cdk-lib/aws-kinesisfirehose");
// const indexName = 'log-stamp-index';
class SQSStack extends cdk.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        devkit_1.logger.info('Initiating SQS');
        this.output = { queues: [] };
        this.templateOptions.description = 'To produce sqs according to properties';
        _props.sqs.forEach((sqsProps) => {
            const queue = new sqs.Queue(this, `${id}-sqs-${sqsProps.queueName}`, sqsProps);
            this.output.queues.push(queue);
        });
        devkit_1.logger.info('🦂');
    }
}
exports.SQSStack = SQSStack;
//# sourceMappingURL=sqs.js.map