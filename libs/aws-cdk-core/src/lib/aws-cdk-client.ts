import { execSync } from 'child_process';
import { LoadedCLI } from './aws-cdk-factory';
import { CdkArguments } from './cdk-arguments';

// cp -Force ./apps/domain/accounting-domain/heartbeat/src/environments/environment.staging.ts ./apps/domain/accounting-domain/heartbeat/src/environments/environment.ts &&

// yarn cdk --profile=dev_console --region=ap-southeast-1 --o=dist/apps/domain/accounting-domain/heartbeat/heartbeat.out --app 'npx ts-node --project=apps/domain/accounting-domain/heartbeat/tsconfig.app.json apps/domain/accounting-domain/heartbeat/src/main.ts' deploy HeartbeatService-staging --context @aws-cdk/core:newStyleStackSynthesis=true --context assume-role-credentials:readIamRoleName=OrganizationDevOpsAccessRole --context assume-role-credentials:writeIamRoleName=OrganizationDevOpsAccessRole --plugin cdk-assume-role-credential-plugin

export class AwsCdkClient {
  constructor(private cliCommand: LoadedCLI, public cwd?: string) {}

  synth(parameters: CdkArguments): Buffer {
    let cmd = `${this.cliCommand.command} synth ${parameters}`;
    return this.logAndExecute(cmd);
  }

  deploy(parameters: CdkArguments): Buffer {
    let cmd = `${this.cliCommand.command} build ${parameters}`;
    // if (parameters) {
    //   parameters = swapArrayFieldValueUsingMap(parameters, 'flag', buildKeyMap);
    //   const paramString = parameters ? getParameterString(parameters) : '';
    //   cmd = `${cmd} ${paramString}`;
    // }
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
