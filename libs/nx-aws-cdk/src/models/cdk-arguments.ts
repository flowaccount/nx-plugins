
// cp -Force ./apps/domain/accounting-domain/heartbeat/src/environments/environment.staging.ts ./apps/domain/accounting-domain/heartbeat/src/environments/environment.ts &&
// cdk --profile=aws_console --region=ap-southeast-1 --o=dist/apps/app-name/api-core.out --app 'npx ts-node --project=/apps/app-name/tsconfig.app.json /apps/app-name/src/main.ts' deploy App-Name-Stack

export interface CdkArguments {
    tsconfigPath: string
    main: string
    buildOutput: string
}

// interface FileReplacementArgumment {
//     fileReplacements?: Array<{
//         replace: string;
//         with: string;
//       }>;
// }

