import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaStackProperties } from '../types';
import { Stack } from 'aws-cdk-lib/core';
export declare class TypescriptLambdaStack extends Stack {
    readonly output: {
        lambdaFunctions?: lambda.Function[];
    };
    constructor(scope: Construct, id: string, _props: LambdaStackProperties);
}
