import { CfnClusterCapacityProviderAssociations } from 'aws-cdk-lib/aws-ecs';
import { Stack, StackProps } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ECSModel, TagModel } from '../types';
interface ECSCapacityProviderProps extends StackProps {
    readonly ecs: ECSModel;
    readonly taglist: TagModel[];
}
export declare class ECSCapacityProvider extends Stack {
    readonly thisClusterCapacityProviderAssociations: CfnClusterCapacityProviderAssociations;
    constructor(scope: Construct, id: string, stackProps: ECSCapacityProviderProps);
}
export {};
