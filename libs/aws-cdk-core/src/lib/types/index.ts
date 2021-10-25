// yarn cdk --profile=dev_console --region=ap-southeast-1 --o=dist/apps/domain/accounting-domain/heartbeat/heartbeat.out --app 'npx ts-node --project=apps/domain/accounting-domain/heartbeat/tsconfig.app.json apps/domain/accounting-domain/heartbeat/src/main.ts' deploy HeartbeatService-staging --context @aws-cdk/core:newStyleStackSynthesis=true --context assume-role-credentials:readIamRoleName=OrganizationDevOpsAccessRole --context assume-role-credentials:writeIamRoleName=OrganizationDevOpsAccessRole --plugin cdk-assume-role-credential-plugin

export type cdkOptions = {
  flag: cdkFlags;
  value?: string | boolean;
}[];

export type cdkSynthOptions = {
  flag: cdkSynthFlags;
  value?: string | boolean;
}[];

export type cdkDiffOptions = {
  flag: cdkDiffFlags;
  value?: string | boolean;
}[];

export type cdkDeployOptions = {
  flag: cdkDeployFlags;
  value?: string | boolean;
}[];

export type cdkDestroyOptions = {
  flag: cdkDestroyFlags;
  value?: string | boolean;
}[];

export type cdkBootstrapOptions = {
  flag: cdkBootstrapFlags;
  value?: string | boolean;
}[];

// Referenced from https://github.com/aws/aws-cdk/blob/master/packages/aws-cdk/README.md

const cdkFlagsArray = [
  'profile',
  'region',
  'app',
  'context',
  'plugin',
  'trace',
  'strict',
  'json',
  'verbose',
  'debug',
  'profile',
  'proxy',
  'ca-bundle-path',
  'ec2creds',
  'role-arn',
  'toolkit-stack-name',
  'output',
  'no-color',
] as const;

export type cdkFlags = typeof cdkFlagsArray[number];

export function iscdkFlag(flag: cdkFlags | string): flag is cdkFlags {
  return cdkFlagsArray.includes(flag as cdkFlags);
}

const cdkSynthFlagsArray = [
  'quiet',
  'exclusively',
  'no-rollback',
  'parameters',
  'progress',
  'no-execute',
  'change-set-name',
] as const;
export type cdkSynthFlags = typeof cdkSynthFlagsArray[number];

export function iscdkSynthFlag(
  flag: cdkSynthFlags | string
): flag is cdkSynthFlags {
  return cdkSynthFlagsArray.includes(flag as cdkSynthFlags);
}

export type cdkDiffFlags =
  | 'template'
  | 'exclusively'
  | 'context-lines'
  | 'security-only'
  | 'fail';

const cdkDeployFlagsArray = [
  'build-exclude',
  'exclusively',
  'require-approval', // "never", "any-change", "broadening"
  'ci',
  'notification-arns',
  'no-execute',
  'change-set-name',
  'force',
  'parameters',
  'outputs-file',
  'previous-parameters',
  'progress',
  'no-rollback',
  'buildTarget',
  'stackName'
] as const;

export type cdkDeployFlags = typeof cdkDeployFlagsArray[number];
export function iscdkDeployFlag(
  flag: cdkDeployFlags | string
): flag is cdkDeployFlags {
  return cdkDeployFlagsArray.includes(flag as cdkDeployFlags);
}

export type cdkDestroyFlags = 'exclusively' | 'force' | 'all';

export type cdkBootstrapFlags = 'profile' | 'app' | 'template';
