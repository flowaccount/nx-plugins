import { execSync } from 'child_process';

/**
 * get CLI command line runner
 *
 * @export
 * @returns {({
 *   command: string,
 *   info: {
 *     global: boolean,
 *     version: string | number
 *   }
 * })}
 */
export function awsCdkFactory(): LoadedCLI {
  // return the command line for local or global awsCdk
  // check if awsCdk is installed
  try {
    const version = execSync('cdk --version').toString('utf-8').trim();
    return {
      command: 'cdk',
      info: {
        global: true,
        version,
      },
    };
  } catch (e) {
    throw new Error('Aws Cdk not installed.');
  }
}

export function mockAwsCdkFactory(): LoadedCLI {
  return { command: 'echo', info: { global: true, version: 0 } };
}

export type LoadedCLI = {
  command: string;
  info: { global: boolean; version: string | number };
};

export type AwsCdkFactory = () => LoadedCLI;
