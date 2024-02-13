"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDbStack = void 0;
const aws_dynamodb_1 = require("aws-cdk-lib/aws-dynamodb");
const core_1 = require("aws-cdk-lib/core");
class DynamoDbStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        this.templateOptions.description = _props.description;
        _props.tables.forEach((table) => {
            const dynamoTable = new aws_dynamodb_1.Table(this, `${table.name}`, table.definition);
            new core_1.CfnOutput(this, 'dynamoDbArn', { value: dynamoTable.tableArn });
        });
    }
}
exports.DynamoDbStack = DynamoDbStack;
//# sourceMappingURL=dynamo-db-stack.js.map