import * as os from 'node:os'
import * as fs from 'node:fs'

let fsIsGracefulified = false

export async function gracefulifyFs() {
  if (os.platform() === 'win32' && !fsIsGracefulified) {
    const gracefulFs = await import('graceful-fs')
    gracefulFs.gracefulify(fs)
    fsIsGracefulified = true
  }
}
