"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypescriptLambdaStack = void 0;
const lambda = require("aws-cdk-lib/aws-lambda");
const lambdaEvent = require("aws-cdk-lib/aws-lambda-event-sources");
const typescript_code_1 = require("../lambda-asset-code/typescript-code");
const core_1 = require("aws-cdk-lib/core");
const aws_kinesis_1 = require("aws-cdk-lib/aws-kinesis");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const devkit_1 = require("@nx/devkit");
class TypescriptLambdaStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        this.templateOptions.description =
            'To produce aws resource to log data into elasticsearch and backup to s3';
        const lambdas = [];
        _props.functions.forEach((f) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const rootPath = process.cwd();
            // lambda.DockerImageCode.fromImageAsset
            const code = typescript_code_1.TypeScriptCode.asset(`${rootPath}/${f.srcRootPath}`);
            devkit_1.logger.info(`Initiating Lambda Function ${f.functionName}:${rootPath}/${f.srcRootPath}`);
            const functionProps = Object.assign(Object.assign({}, f), { code: code, vpc: _props.vpc, vpcSubnets: _props.subnets, role: _props.role, securityGroups: f.securityGroupIds.map((secgroupId) => aws_ec2_1.SecurityGroup.fromSecurityGroupId(this, `${id}-${secgroupId}-sg`, secgroupId)) });
            const lambdaFunction = new lambda.Function(this, `${id}-${functionProps.functionName}`, functionProps);
            if ((_a = f.eventProperties) === null || _a === void 0 ? void 0 : _a.kinesisEventSource) {
                devkit_1.logger.info(`attaching data stream ${(_b = f.eventProperties) === null || _b === void 0 ? void 0 : _b.kinesisEventSource.dataStreamArn}`);
                const stream = aws_kinesis_1.Stream.fromStreamArn(this, 'dataStreamSource', (_c = f.eventProperties) === null || _c === void 0 ? void 0 : _c.kinesisEventSource.dataStreamArn);
                lambdaFunction.addEventSource(new lambdaEvent.KinesisEventSource(stream, {
                    startingPosition: lambda.StartingPosition.LATEST,
                }));
            }
            if ((_d = f.eventProperties) === null || _d === void 0 ? void 0 : _d.sqsEventSource) {
                devkit_1.logger.info(`attaching sqs ${(_e = f.eventProperties) === null || _e === void 0 ? void 0 : _e.sqsEventSource.queue.queueName}`);
                if (!((_f = f.eventProperties) === null || _f === void 0 ? void 0 : _f.sqsEventSource.queue)) {
                    throw new Error('SQS IQueue is null, please make sure it is not to hook the event source to lambda');
                }
                lambdaFunction.addEventSource(new lambdaEvent.SqsEventSource((_g = f.eventProperties) === null || _g === void 0 ? void 0 : _g.sqsEventSource.queue, (_h = f.eventProperties) === null || _h === void 0 ? void 0 : _h.sqsEventSource.properties));
            }
            lambdas.push(lambdaFunction);
        });
        this.output = { lambdaFunctions: lambdas };
    }
}
exports.TypescriptLambdaStack = TypescriptLambdaStack;
//# sourceMappingURL=lambda-stack.js.map