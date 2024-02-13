"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VpcStack = void 0;
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const core_1 = require("aws-cdk-lib/core");
const devkit_1 = require("@nx/devkit");
class VpcStack extends core_1.Stack {
    constructor(scope, id, _props) {
        super(scope, id, _props);
        devkit_1.logger.info('fetching vpc by its attributes');
        this.vpc = aws_ec2_1.Vpc.fromVpcAttributes(this, `${id}-${_props.vpcAttributes.vpcId}`, _props.vpcAttributes);
        this.subnetSelection = {
            subnets: _props.subnets.map((attr, index) => aws_ec2_1.Subnet.fromSubnetAttributes(this, `subnet${index}`, attr)),
        };
    }
}
exports.VpcStack = VpcStack;
//# sourceMappingURL=vpc.js.map