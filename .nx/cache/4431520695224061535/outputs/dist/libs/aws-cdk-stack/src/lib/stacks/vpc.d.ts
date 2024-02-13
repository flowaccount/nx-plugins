import { IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2';
import { Stack } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { VpcStackProperties } from '../types';
export declare class VpcStack extends Stack {
    readonly vpc: IVpc;
    readonly subnetSelection: SubnetSelection;
    constructor(scope: Construct, id: string, _props: VpcStackProperties);
}
