import { ChildProcess, spawn } from 'child_process'
import * as treeKill from 'tree-kill'
import { runWaitUntilTargets } from '../../utils/target.schedulers'
import { ExecutorContext, logger } from '@nx/devkit'
import { promisify } from 'util'
import * as dotEnvJson from 'dotenv-json'
import {
  InspectType,
  ServerlessExecuteBuilderOptions,
  SimpleBuildEvent,
} from '../../utils/types'
import { getSlsCommand } from '../../utils/packagers'
import * as path from 'node:path'
import { copySync, pathExistsSync } from 'fs-extra'
import { buildTarget } from '../build/build.impl'

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config()
} catch (e) {
  console.log(`Error:`, e)
}

let subProcess: ChildProcess
export async function* offlineExecutor(
  options: ServerlessExecuteBuilderOptions,
  context: ExecutorContext
) {
  console.log(options)
  process.on('SIGTERM', () => {
    subProcess?.kill()
    process.exit(128 + 15)
  })
  process.on('exit', (code) => {
    process.exit(code)
  })

  const hasSrcPath = pathExistsSync(path.join(options.package, 'src'))
  if (!options.skipBuild || !hasSrcPath) {
    // build into output path before running serverless offline.
    if (options.waitUntilTargets && options.waitUntilTargets.length > 0) {
      const results = await runWaitUntilTargets(
        options.waitUntilTargets,
        context
      )
      for (const [i, result] of results.entries()) {
        if (!result.success) {
          console.log('throw')
          throw new Error(
            `Wait until target failed: ${options.waitUntilTargets[i]}.`
          )
        }
      }
    }
    const iterator = await buildTarget(options, context);
    const buildOutput = <SimpleBuildEvent>(await iterator.next()).value;
    if (buildOutput.error) {
      console.log(`Build error: ${buildOutput.error}`)
    } else {
      console.log(`Build success: ${buildOutput.outfile}`)
    }
  }

  options.watch = true

  await handleBuildEvent({ success: true }, options)
  yield ({ success: true })

  return new Promise<{ success: boolean }>(() => {
    true
  })
}
async function handleBuildEvent(
  event: { success: boolean },
  options: ServerlessExecuteBuilderOptions
) {
  if ((!event.success || options.watch) && subProcess) {
    await killProcess()
  }
  logger.info('running process')
  runProcess(event, options)
}

function runProcess(
  event: SimpleBuildEvent,
  options: ServerlessExecuteBuilderOptions
) {

  if (subProcess || !event.success) {
    return
  }
  dotEnvJson({
    path: `${options.location}/${options.processEnvFile ?? 'env-staging.json'}`
  })
  const slsCommand = getSlsCommand()
  let stringifiedArgs = `offline --config ${options.config} --stage ${options.stage}`
  const args: string[] = []
  args.push('offline')
  args.push(`--stage=${options.stage}`)

  const configPath = path.parse(options.config)

  if (options.package) {
    copySync(options.config, path.join(options.package, configPath.base), { overwrite: true })
  } else {
    console.log('No package path provided')
    return
  }

  if (options.verbose) {
    stringifiedArgs += ' --verbose'
    args.push('--verbose')
  }
  const fullCommand = `${slsCommand} ${stringifiedArgs}`.trim()
  console.log(`Executing Command: ${fullCommand} in cwd: ${options.package} `)
  subProcess = spawn(
    'npx',
    ['sls', ...args], { stdio: 'inherit', cwd: options.package }
  )

  subProcess.on('message', (message) => {
    console.log('Message from child process:', message)
  })
  subProcess.on('error', (err) => {
    console.log(err)
  })
  subProcess.once('exit', (code) => {
    if (code === 0) Promise.resolve({ success: true });
    // If process is killed due to current task being killed, then resolve with success.
    else Promise.resolve({ success: true })
  })
}

async function killProcess() {
  if (!subProcess || !subProcess.pid) {
    return
  }

  const promisifiedTreeKill: (pid: number, signal: string) => Promise<void> =
    promisify(treeKill)
  try {
    await promisifiedTreeKill(subProcess.pid, 'SIGTERM')
  } catch (err) {
    if (Array.isArray(err) && err[0] && err[2]) {
      const errorMessage = err[2]
      logger.error(errorMessage)
    } else if (err.message) {
      logger.error(err.message)
    }
  }
}

function getServerlessArg(options: ServerlessExecuteBuilderOptions) {
  const args = ['offline', ...options.args]
  if (options.inspect === true) {
    options.inspect = InspectType.Inspect
  }
  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`)
  }
  return args
}

function getExecArgv(options: ServerlessExecuteBuilderOptions) {
  const args: string[] = []
  if (options.inspect === true) {
    options.inspect = InspectType.Inspect
  }

  if (options.inspect) {
    args.push(`--${options.inspect}=${options.host}:${options.port}`)
  }
  args.push('offline')
  for (const key in options) {
    const hasOwnProperty = Object.prototype.hasOwnProperty.call(options, key)
    if (hasOwnProperty) {
      if (options[key] !== undefined) {
        args.push(`--${key}=${options[key]}`)
      }
    }
  }
  return args
}

export default offlineExecutor
