// import { logger } from "@nx/devkit";
// import { EventSourceProperties, IApplicationStackEnvironmentConfig, InlineRoleStackProperties, LambdaConfigurationBuilderOption, LambdaStackConfiguration } from '../../types';
// import { BaseApplicationStackBuilder } from "./base-application-stack-builder";
// import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
// import { Runtime } from "aws-cdk-lib/aws-lambda";
// import { Duration, StackProps } from "aws-cdk-lib/core";
// export class ServerlessApplicationBuilder extends BaseApplicationStackBuilder {
//     constructor(
//          protected _applicationConfig: IApplicationStackEnvironmentConfig,
//          protected _lambdaFunctions: LambdaConfigurationBuilderOption[]
//         ) {
//         super(_applicationConfig)
//     }
//     BuildStackConfiguration(): StackProps {
//         if(!this._applicationConfig.serverless) {
//             this._applicationConfig.serverless = {
//                 lambdaFunctions: this.lambdaFunctions
//             }
//         }
//         return this._applicationConfig.serverless
//     }
// }
//# sourceMappingURL=serverless-application-builder.js.map