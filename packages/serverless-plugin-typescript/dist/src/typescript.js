"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const fs = require("fs-extra");
const _ = require("lodash");
const path = require("path");
function makeDefaultTypescriptConfig() {
    const defaultTypescriptConfig = {
        preserveConstEnums: true,
        strictNullChecks: true,
        sourceMap: true,
        allowJs: true,
        target: ts.ScriptTarget.ES5,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        lib: ['lib.es2015.d.ts'],
        rootDir: './',
    };
    return defaultTypescriptConfig;
}
exports.makeDefaultTypescriptConfig = makeDefaultTypescriptConfig;
function extractFileNames(cwd,servicePath, provider, functions) {
    // The Google provider will use the entrypoint not from the definition of the
    // handler function, but instead from the package.json:main field, or via a
    // index.js file. This check reads the current package.json in the same way
    // that we already read the tsconfig.json file, by inspecting the current
    // working directory. If the packageFile does not contain a valid main, then
    // it instead selects the index.js file.
    // NX Wont work with google having different package.json from the workspace. // Nam
    if (provider === 'google') {
        const packageFilePath = path.join(cwd, 'package.json');
        if (fs.existsSync(packageFilePath)) {
            // Load in the package.json file.
            const packageFile = JSON.parse(fs.readFileSync(packageFilePath).toString());
            // Either grab the package.json:main field, or use the index.ts file.
            // (This will be transpiled to index.js).
            const main = packageFile.main ? packageFile.main.replace(/\.js$/, '.ts') : 'index.ts';
            // Check that the file indeed exists.
            if (!fs.existsSync(path.join(cwd, main))) {
                console.log(`Cannot locate entrypoint, ${main} not found`);
                throw new Error('Typescript compilation failed');
            }
            return [main];
        }
    }
    return _.values(functions)
        .map(fn => fn.handler)
        .map(h => {
        const fnName = _.last(h.split('.'));
        const fnNameLastAppearanceIndex = h.lastIndexOf(fnName);
        // replace only last instance to allow the same name for file and handler
        const fileName = h.substring(0, fnNameLastAppearanceIndex);
        // Check if the .ts files exists. If so return that to watch
        // servicePath + "/" +
        if (fs.existsSync(path.join(servicePath, fileName + 'ts'))) {
            return  servicePath + '/' + fileName + 'ts';
        }
        // Check if the .js files exists. If so return that to watch
        if (fs.existsSync(path.join(servicePath, fileName + 'js'))) {
            return  servicePath + '/' +  fileName + 'js';
        }
        // Can't find the files. Watch will have an exception anyway. So throw one with error.
        console.log(`Cannot locate handler - ${fileName} not found`);
        throw new Error('Typescript compilation failed. Please ensure handlers exists with ext .ts or .js');
    });
}
exports.extractFileNames = extractFileNames;
function run(fileNames, options) {
   
    return __awaiter(this, void 0, void 0, function* () {
        options.listEmittedFiles = true;
        const program = ts.createProgram(fileNames, options);
        const emitResult = program.emit();
        const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        allDiagnostics.forEach(diagnostic => {
           
            if (!diagnostic.file) {
                console.log(diagnostic);
            }
            
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        });
        if (emitResult.emitSkipped) {
            throw new Error('Typescript compilation failed');
        }
       
        
        return emitResult.emittedFiles.filter(filename => filename.endsWith('.js') );
    });
}
exports.run = run;
/*
 * based on rootFileNames returns list of all related (e.g. imported) source files
 */
function getSourceFiles(rootFileNames, options) {
    
    const program = ts.createProgram(rootFileNames, options);
    const programmFiles = program.getSourceFiles()
        .map(file => file.fileName)
        .filter(file => {
        return file.split(path.sep).indexOf('node_modules') < 0;
    });
   
    return programmFiles;
}
exports.getSourceFiles = getSourceFiles;
function getTypescriptConfig(cwd, servicePath, logger) {
    const configFilePath = path.join(servicePath, 'tsconfig.json');
   
    if (fs.existsSync(configFilePath)) {
        const configFileText = fs.readFileSync(configFilePath).toString();
        const result = ts.parseConfigFileTextToJson(configFilePath, configFileText);
        if (result.error) {
            throw new Error(JSON.stringify(result.error));
        }
        const configParseResult = ts.parseJsonConfigFileContent(result.config, ts.sys, path.dirname(configFilePath));
        if (configParseResult.errors.length > 0) {
            throw new Error(JSON.stringify(configParseResult.errors));
        }
        if (logger) {
            logger.log(`Using local tsconfig.json`);
        }
        // disallow overrriding rootDir
        if (configParseResult.options.rootDir && path.resolve(configParseResult.options.rootDir) !== path.resolve(servicePath) && logger) {
            logger.log('Warning: "rootDir" from local tsconfig.json is overriden');
        }

        configParseResult.options.rootDir = './' ;
        return configParseResult.options;
    }
    return makeDefaultTypescriptConfig();
}
exports.getTypescriptConfig = getTypescriptConfig;
//# sourceMappingURL=typescript.js.map