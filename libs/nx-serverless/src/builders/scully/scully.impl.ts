// npx scully --nw --configFile apps/frontend/flowaccount-landing/scully.config.js --removeStaticDist
import { ExecutorContext, logger } from '@nx/devkit';
import { buildTarget } from '../deploy/deploy.impl';
import { getSourceRoot } from '../../utils/normalize';
import { SimpleBuildEvent } from '../../utils/types';
import { execSync } from 'child_process';
export interface ScullyBuilderOptions {
  buildTarget: string;
  skipBuild: boolean;
  configFiles: string[];
  showGuessError?: boolean;
  showBrowser?: boolean;
  removeStaticDist?: boolean;
  baseFilter?: string;
  proxy?: string;
  open?: boolean;
  scanRoutes?: boolean;
  highlight?: boolean;
}

export async function scullyCmdRunner(
  options: ScullyBuilderOptions,
  context: ExecutorContext
) {
  if (options.skipBuild) {
    await runScully(options, context);
  } else {
    const iterator = await buildTarget(options, context);
    const event = <SimpleBuildEvent>(await iterator.next()).value;

    if (!event.success) {
      logger.error('Build target failed!');
      return { success: false };
    }
    await runScully(options, context);
  }
  return { success: true };
}

export default scullyCmdRunner;

async function runScully(
  options: ScullyBuilderOptions,
  context: ExecutorContext
) {
  const args = getExecArgv(options);
  const root = getSourceRoot(context);

  for(const configFile of options.configFiles) {
    const scullyCommand = [
      'scully',
      `--configFile=${configFile}`,
      '--disableProjectFolderCheck',
      ...args
    ].join(' ')
    console.log(scullyCommand)
    execSync(scullyCommand, { cwd: root })
  }
}

function getExecArgv(options: ScullyBuilderOptions) {
  const args = [];
  const keys = Object.keys(options);
  keys.forEach((key) => {
    if (
      options[key] !== undefined &&
      key !== 'buildTarget' &&
      key != 'configFiles' &&
      key != 'skipBuild'
    ) {
      // if(typeof(options[key]) == 'boolean') {
      //   args.push(`--${key}`);
      // } else {
      args.push(`--${key}=${options[key]}`);
      // }
    }
  });
  return args;
}
