// yarn cdk --profile=dev_console --region=ap-southeast-1 --o=dist/apps/domain/accounting-domain/heartbeat/heartbeat.out --app 'npx ts-node --project=apps/domain/accounting-domain/heartbeat/tsconfig.app.json apps/domain/accounting-domain/heartbeat/src/main.ts' deploy HeartbeatService-staging --context @aws-cdk/core:newStyleStackSynthesis=true --context assume-role-credentials:readIamRoleName=OrganizationDevOpsAccessRole --context assume-role-credentials:writeIamRoleName=OrganizationDevOpsAccessRole --plugin cdk-assume-role-credential-plugin

export interface CdkArguments {
  profile: string;
  region: AwsRegion;
  output: string;
  tsconfigPath: string;
  main: string;
  stackName: string;
  assumeRole: boolean;
  roleName: string;
}

//npx cdk bootstrap --trust 265515193476 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://765141697745/ap-southeast-1 --context @aws-cdk/core:newStyleStackSynthesis=true --context assume-role-credentials:readIamRoleName=arn:aws:iam::765141697745:role/OrganizationDevOpsAccessRole --context assume-role-credentials:writeIamRoleName=arn:aws:iam::765141697745:role/OrganizationDevOpsAccessRole --plugin cdk-assume-role-credential-plugin

export interface CdkBootstrapArguments {
  trustAccount: string;
  executionPolicyArn: AwsRegion;
  accountId: string;
  region: AwsRegion;
  main: string;
  stackName: string;
  assumeRole: boolean;
  roleName: string;
  readIamRoleName: string;
  writeIamRoleName: string;
}
