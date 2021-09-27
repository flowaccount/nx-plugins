//npx cdk bootstrap --trust 265515193476 --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://765141697745/ap-southeast-1 --context @aws-cdk/core:newStyleStackSynthesis=true --context assume-role-credentials:readIamRoleName=arn:aws:iam::765141697745:role/OrganizationDevOpsAccessRole --context assume-role-credentials:writeIamRoleName=arn:aws:iam::765141697745:role/OrganizationDevOpsAccessRole --plugin cdk-assume-role-credential-plugin
  
export interface CdkBootstrapArguments {
    trustAccount: string;
    executionPolicyArn: string;
    accountId: string;
    region: string;
    main: string;
    stackName: string;
    assumeRole: boolean;
    roleName: string;
    readIamRoleName: string;
    writeIamRoleName: string;
  }