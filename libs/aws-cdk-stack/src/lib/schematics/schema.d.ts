const cdkSchematicFlagsArray = [
  'profile',
  'region',
  'verbose',
  'debug',
  'profile',
  'output',
  'name',
  'tags',
  'directory',
  'unitTestRunner',
  'baseWorkspaceTsConfig',
  'skipFormat',
  'handlers',
  'eventSources',
  'vpcId',
] as const;

export type cdkSchematicFlags = typeof cdkSchematicFlagsArray[number];

export function iscdkSchematicFlag(
  flag: cdkSchematicFlags | string
): flag is cdkSchematicFlags {
  return cdkSchematicFlagsArray.includes(flag as cdkSchematicFlags);
}

export type Schema = {
  vpcPrivateSubnetIds: [];
  subnetIds: string[];
  availabilityZones: string[];
  securityGroupIds: string[];
  handler: string;
  lambdaMemmorySizes: number;
  timeout: number;
  lambdaFunctions: string[];
  functionNames: string[];
  timeouts: number[];
  memmorySizes: number[];
} & { [key in cdkSchematicFlags]?: string };
