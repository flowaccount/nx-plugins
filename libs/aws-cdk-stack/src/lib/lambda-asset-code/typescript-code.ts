/* eslint-disable @typescript-eslint/no-use-before-define */
//https://github.com/cloudeninc/clouden-cdk-aws-lambda-typescript
import { Construct } from '@aws-cdk/core';
import { Code, AssetCode } from '@aws-cdk/aws-lambda';
import * as pathModule from 'path';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import { logger } from '@nrwl/devkit';
import { copy, ensureFileSync } from 'fs-extra';

const typeScriptAlreadyBuilt: string[] = []; // list of source code paths already built in this session

interface CopyFileItem {
  sourcePath: string;
  targetPath: string;
}

export interface TypeScriptAssetCodeOptions {
  npmInstallCommand?: string;
  npmInstallArguments?: string[];
  copyFiles?: CopyFileItem[];
}

const defaultTypeScriptAssetCodeOptions = {
  npmInstallCommand: 'npm',
  npmInstallArguments: ['install', '--production'],
  copyFiles: [],
};

/**
 * Wrapper for the Code abstract class, which provides some static helper methods.
 */
export abstract class TypeScriptCode extends Code {
  public static asset(
    path: string,
    distPath?: string,
    options?: TypeScriptAssetCodeOptions
  ): TypeScriptAssetCode {
    return new TypeScriptAssetCode(path, distPath, options);
  }
}

function copySourceToBePackaged(srcPath: string, outputPath: string): boolean {
  logger.info(
    `Copying src files from ${srcPath} to ${outputPath} to be packaged`
  );
  ensureFileSync(outputPath);
  fs.copyFileSync(srcPath, outputPath);
  logger.info('Done copying build output files.');
  return true;
}

/**
 * Extension for AssetCode to run a TypeScript build step before deployment.
 */
export class TypeScriptAssetCode extends AssetCode {
  private originalSourcePath: string;
  private typeScriptSourcePath: string; // original source code path
  private typeScriptAssetCodeOptions: TypeScriptAssetCodeOptions;

  constructor(
    path: string,
    distPath?: string,
    options?: TypeScriptAssetCodeOptions
  ) {
    // Add a .deploy subfolder which contains the built files and is deployed to S3
    let destPath = path;
    if (distPath) {
      copySourceToBePackaged(path, distPath);
      destPath = distPath;
    }
    super(pathModule.join(destPath, '.deploy'));
    this.originalSourcePath = path;
    // Remember the original source folder
    this.typeScriptSourcePath = destPath;
    this.originalSourcePath = path;
    this.typeScriptAssetCodeOptions = Object.assign(
      {},
      defaultTypeScriptAssetCodeOptions,
      options || {}
    );
  }

  public bind(construct: Construct) {
    this.typeScriptBuild();
    return super.bind(construct);
  }

  private typeScriptBuild() {
    // Keep track of which folders have already been built
    logger.info(
      `Building typescript application from source path:${this.typeScriptSourcePath}`
    );
    if (typeScriptAlreadyBuilt.includes(this.typeScriptSourcePath)) {
      return;
    }
    typeScriptAlreadyBuilt.push(this.typeScriptSourcePath);

    // Ensure the deploy path exists
    try {
      fs.mkdirSync(this.path);
    } catch (err) {
      // ignore errors
    }

    // Run the TypeScript compiler in our own module path, so that our own dependency is used
    const tscChild = child_process.spawnSync(
      'npx',
      ['tsc', '--project', this.typeScriptSourcePath, '--outDir', this.path],
      {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true,
      }
    );
    if (tscChild.error) {
      throw tscChild.error;
    }
    if (tscChild.status !== 0) {
      throw new Error('TypeScript compiler error: ' + tscChild.status);
    }

    // Copy additional files if specified
    for (const copyFile of this.typeScriptAssetCodeOptions.copyFiles || []) {
      const sourcePath = pathModule.join(
        this.typeScriptSourcePath,
        copyFile.sourcePath
      ); // relative to user specified path
      const targetPath = pathModule.join(this.path, copyFile.targetPath); // relative to .deploy
      const targetPathParts = pathModule.parse(targetPath);
      mkdirp.sync(targetPathParts.dir);
      fs.copyFileSync(sourcePath, targetPath);
    }

    function readFileSyncOrNull(filepath: string, encoding: 'utf8') {
      try {
        return fs.readFileSync(filepath, { encoding: encoding });
      } catch (err) {
        if (err.code === 'ENOENT') return null;
        else throw err;
      }
    }

    // Run NPM package install so that the Lambda function gets all dependencies - unless we've already run it

    // New versions in source path
    const newPackageLockData = readFileSyncOrNull(
      pathModule.join(this.typeScriptSourcePath, 'package-lock.json'),
      'utf8'
    );
    const newPackageData = readFileSyncOrNull(
      pathModule.join(this.typeScriptSourcePath, 'package.json'),
      'utf8'
    );

    // Old versions in deploy path (if any)
    const oldPackageLockData = readFileSyncOrNull(
      pathModule.join(this.path, 'package-lock.json'),
      'utf8'
    );
    const oldPackageData = readFileSyncOrNull(
      pathModule.join(this.path, 'package.json'),
      'utf8'
    );

    if (
      newPackageData &&
      newPackageLockData &&
      (newPackageData !== oldPackageData ||
        newPackageLockData !== oldPackageLockData)
    ) {
      // We have a package.json, and either package.json or package-lock.json has changed since last build, or no build done yet
      fs.writeFileSync(
        pathModule.join(this.path, 'package-lock.json'),
        newPackageLockData,
        'utf8'
      );
      fs.writeFileSync(
        pathModule.join(this.path, 'package.json'),
        newPackageData,
        'utf8'
      );

      // Execute npm install
      const npmChild = child_process.spawnSync(
        this.typeScriptAssetCodeOptions.npmInstallCommand!,
        this.typeScriptAssetCodeOptions.npmInstallArguments,
        {
          cwd: this.path,
          stdio: 'inherit',
          shell: true,
        }
      );
      if (npmChild.error) {
        throw npmChild.error;
      }
      if (npmChild.status !== 0) {
        throw new Error('TypeScript compiler error: ' + npmChild.status);
      }
    }
  }
}
function copySync(srcPath: string, outputPath: string) {
  throw new Error('Function not implemented.');
}
