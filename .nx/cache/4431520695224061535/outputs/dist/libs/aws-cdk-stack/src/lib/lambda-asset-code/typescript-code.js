"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeScriptAssetCode = exports.TypeScriptCode = void 0;
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const pathModule = require("path");
const child_process = require("child_process");
const fs = require("fs");
const mkdirp = require("mkdirp");
const devkit_1 = require("@nx/devkit");
const fs_extra_1 = require("fs-extra");
const typeScriptAlreadyBuilt = []; // list of source code paths already built in this session
const defaultTypeScriptAssetCodeOptions = {
    npmInstallCommand: 'npm',
    npmInstallArguments: ['install', '--production'],
    copyFiles: [],
};
/**
 * Wrapper for the Code abstract class, which provides some static helper methods.
 */
class TypeScriptCode extends aws_lambda_1.Code {
    static asset(path, distPath, options) {
        return new TypeScriptAssetCode(path, distPath, options);
    }
}
exports.TypeScriptCode = TypeScriptCode;
function copySourceToBePackaged(srcPath, outputPath) {
    devkit_1.logger.info(`Copying src files from ${srcPath} to ${outputPath} to be packaged`);
    (0, fs_extra_1.ensureFileSync)(outputPath);
    fs.copyFileSync(srcPath, outputPath);
    devkit_1.logger.info('Done copying build output files.');
    return true;
}
/**
 * Extension for AssetCode to run a TypeScript build step before deployment.
 */
class TypeScriptAssetCode extends aws_lambda_1.AssetCode {
    constructor(path, distPath, options) {
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
        this.typeScriptAssetCodeOptions = Object.assign({}, defaultTypeScriptAssetCodeOptions, options || {});
    }
    bind(construct) {
        this.typeScriptBuild();
        return super.bind(construct);
    }
    typeScriptBuild() {
        // Keep track of which folders have already been built
        devkit_1.logger.info(`Building typescript application from source path:${this.typeScriptSourcePath}`);
        if (typeScriptAlreadyBuilt.includes(this.typeScriptSourcePath)) {
            return;
        }
        typeScriptAlreadyBuilt.push(this.typeScriptSourcePath);
        // Ensure the deploy path exists
        try {
            fs.mkdirSync(this.path);
        }
        catch (err) {
            // ignore errors
        }
        // Run the TypeScript compiler in our own module path, so that our own dependency is used
        const tscChild = child_process.spawnSync('npx', ['tsc', '--project', this.typeScriptSourcePath, '--outDir', this.path], {
            cwd: __dirname,
            stdio: 'inherit',
            shell: true,
        });
        if (tscChild.error) {
            throw tscChild.error;
        }
        if (tscChild.status !== 0) {
            throw new Error('TypeScript compiler error: ' + tscChild.status);
        }
        // Copy additional files if specified
        for (const copyFile of this.typeScriptAssetCodeOptions.copyFiles || []) {
            const sourcePath = pathModule.join(this.typeScriptSourcePath, copyFile.sourcePath); // relative to user specified path
            const targetPath = pathModule.join(this.path, copyFile.targetPath); // relative to .deploy
            const targetPathParts = pathModule.parse(targetPath);
            mkdirp.sync(targetPathParts.dir);
            fs.copyFileSync(sourcePath, targetPath);
        }
        function readFileSyncOrNull(filepath, encoding) {
            try {
                return fs.readFileSync(filepath, { encoding: encoding });
            }
            catch (err) {
                if (err.code === 'ENOENT')
                    return null;
                else
                    throw err;
            }
        }
        // Run NPM package install so that the Lambda function gets all dependencies - unless we've already run it
        // New versions in source path
        const newPackageLockData = readFileSyncOrNull(pathModule.join(this.typeScriptSourcePath, 'package-lock.json'), 'utf8');
        const newPackageData = readFileSyncOrNull(pathModule.join(this.typeScriptSourcePath, 'package.json'), 'utf8');
        // Old versions in deploy path (if any)
        const oldPackageLockData = readFileSyncOrNull(pathModule.join(this.path, 'package-lock.json'), 'utf8');
        const oldPackageData = readFileSyncOrNull(pathModule.join(this.path, 'package.json'), 'utf8');
        if (newPackageData &&
            newPackageLockData &&
            (newPackageData !== oldPackageData ||
                newPackageLockData !== oldPackageLockData)) {
            // We have a package.json, and either package.json or package-lock.json has changed since last build, or no build done yet
            fs.writeFileSync(pathModule.join(this.path, 'package-lock.json'), newPackageLockData, 'utf8');
            fs.writeFileSync(pathModule.join(this.path, 'package.json'), newPackageData, 'utf8');
            // Execute npm install
            const npmChild = child_process.spawnSync(this.typeScriptAssetCodeOptions.npmInstallCommand, this.typeScriptAssetCodeOptions.npmInstallArguments, {
                cwd: this.path,
                stdio: 'inherit',
                shell: true,
            });
            if (npmChild.error) {
                throw npmChild.error;
            }
            if (npmChild.status !== 0) {
                throw new Error('TypeScript compiler error: ' + npmChild.status);
            }
        }
    }
}
exports.TypeScriptAssetCode = TypeScriptAssetCode;
function copySync(srcPath, outputPath) {
    throw new Error('Function not implemented.');
}
//# sourceMappingURL=typescript-code.js.map