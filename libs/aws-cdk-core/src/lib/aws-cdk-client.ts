import { execSync } from 'child_process';
import { LoadedCLI } from './aws-cdk-factory';
import {
  cdkDeployOptions,
  cdkDestroyOptions,
  cdkDiffOptions,
  cdkOptions,
  cdkSynthOptions,
} from './types';
import { getParameterString } from './utils';

// cp -Force ./apps/domain/accounting-domain/heartbeat/src/environments/environment.staging.ts ./apps/domain/accounting-domain/heartbeat/src/environments/environment.ts &&

// yarn cdk --profile=dev_console --region=ap-southeast-1 --o=dist/apps/domain/accounting-domain/heartbeat/heartbeat.out --app 'npx ts-node --project=apps/domain/accounting-domain/heartbeat/tsconfig.app.json apps/domain/accounting-domain/heartbeat/src/main.ts' deploy HeartbeatService-staging --context aws-cdk-lib/core:newStyleStackSynthesis=true --context assume-role-credentials:readIamRoleName=OrganizationDevOpsAccessRole --context assume-role-credentials:writeIamRoleName=OrganizationDevOpsAccessRole --plugin cdk-assume-role-credential-plugin

export class AwsCdkClient {
  constructor(private cliCommand: LoadedCLI, public cwd?: string) {}

  private cdkCommandRunner(
    command: string,
    stackName: string,
    cdkParameters: cdkOptions,
    paramString: string
  ): Buffer {
    let cmd = `${this.cliCommand.command} ${command} ${stackName}`;
    const cdkParamString = cdkParameters
      ? getParameterString(cdkParameters)
      : '';
    cmd = `${cmd} ${cdkParamString} ${paramString}`;
    return this.logAndExecute(cmd);
  }

  // cdk --profile=aws_console --region=ap-southeast-1 --o=dist/apps/app-name/api-core.out --app 'npx ts-node --project=/apps/app-name/tsconfig.app.json /apps/app-name/src/main.ts' deploy App-Name-Stack
  synth(
    stackName: string,
    cdkParameters: cdkOptions,
    parameters: cdkSynthOptions
  ): Buffer {
    const paramString = parameters ? getParameterString(parameters) : '';
    return this.cdkCommandRunner(
      'synth',
      stackName,
      cdkParameters,
      paramString
    );
  }

  diff(
    stackName: string,
    cdkParameters: cdkOptions,
    parameters: cdkDiffOptions
  ): Buffer {
    const paramString = parameters ? getParameterString(parameters) : '';
    return this.cdkCommandRunner('diff', stackName, cdkParameters, paramString);
  }

  deploy(
    stackName: string,
    cdkParameters: cdkOptions,
    parameters: cdkDeployOptions
  ): Buffer {
    const paramString = parameters ? getParameterString(parameters) : '';
    return this.cdkCommandRunner(
      'deploy',
      stackName,
      cdkParameters,
      paramString
    );
  }

  destroy(
    stackName: string,
    cdkParameters: cdkOptions,
    parameters: cdkDestroyOptions
  ): Buffer {
    const paramString = parameters ? getParameterString(parameters) : '';
    return this.cdkCommandRunner(
      'destroy',
      stackName,
      cdkParameters,
      paramString
    );
  }

  doctor(): Buffer {
    const cmd = `${this.cliCommand.command} doctor`;
    return this.logAndExecute(cmd);
  }

  printSdkVersion(): Buffer {
    return this.logAndExecute('cdk --version');
  }

  private logAndExecute(cmd: string): Buffer {
    console.log(`Executing Command: ${cmd}`);
    return execSync(cmd, { stdio: 'inherit', cwd: this.cwd || process.cwd() });
  }
}
