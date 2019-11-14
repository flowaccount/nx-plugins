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
const schematics_1 = require("@angular-devkit/schematics");
const stripJsonComments = require("strip-json-comments");
const testing_1 = require("@nrwl/workspace/testing");
const testing_2 = require("../../utils/testing");
const workspace_1 = require("@nrwl/workspace");
const testing_3 = require("../../../../angular/src/utils/testing");
describe('app', () => {
    let appTree;
    beforeEach(() => {
        appTree = schematics_1.Tree.empty();
        appTree = testing_1.createEmptyWorkspace(appTree);
    });
    describe('not nested', () => {
        it('should update workspace.json', () => __awaiter(this, void 0, void 0, function* () {
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp' }, appTree);
            const workspaceJson = workspace_1.readJsonInTree(tree, '/workspace.json');
            const project = workspaceJson.projects['my-serveless-app'];
            expect(project.root).toEqual('apps/my-serveless-app');
            expect(project.architect).toEqual(jasmine.objectContaining({
                build: {
                    builder: '@nx/serverless:build',
                    options: {
                        outputPath: 'dist/apps/my-serveless-app',
                        main: 'apps/my-serveless-app/src/main.ts',
                        tsConfig: 'apps/my-serveless-app/tsconfig.app.json',
                        assets: ['apps/my-serveless-app/src/assets']
                    },
                    configurations: {
                        production: {
                            optimization: true,
                            extractLicenses: true,
                            inspect: false,
                            fileReplacements: [
                                {
                                    replace: 'apps/my-serveless-app/src/environments/environment.ts',
                                    with: 'apps/my-serveless-app/src/environments/environment.prod.ts'
                                }
                            ]
                        }
                    }
                },
                serve: {
                    builder: '@nx/serverless:execute',
                    options: {
                        buildTarget: 'my-serveless-app:build'
                    }
                }
            }));
            expect(workspaceJson.projects['my-serveless-app'].architect.lint).toEqual({
                builder: '@angular-devkit/build-angular:tslint',
                options: {
                    tsConfig: [
                        'apps/my-serveless-app/tsconfig.app.json',
                        'apps/my-serveless-app/tsconfig.spec.json'
                    ],
                    exclude: ['**/node_modules/**', '!apps/my-serveless-app/**']
                }
            });
            expect(workspaceJson.projects['my-serveless-app-e2e']).toBeUndefined();
            expect(workspaceJson.defaultProject).toEqual('my-serveless-app');
        }));
        it('should update nx.json', () => __awaiter(this, void 0, void 0, function* () {
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp', tags: 'one,two' }, appTree);
            const nxJson = workspace_1.readJsonInTree(tree, '/nx.json');
            expect(nxJson).toEqual({
                npmScope: 'proj',
                projects: {
                    'my-serveless-app': {
                        tags: ['one', 'two']
                    }
                }
            });
        }));
        it('should generate files', () => __awaiter(this, void 0, void 0, function* () {
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp' }, appTree);
            expect(tree.exists(`apps/my-serveless-app/jest.config.js`)).toBeTruthy();
            expect(tree.exists('apps/my-serveless-app/src/main.ts')).toBeTruthy();
            const tsconfig = workspace_1.readJsonInTree(tree, 'apps/my-serveless-app/tsconfig.json');
            expect(tsconfig.extends).toEqual('../../tsconfig.json');
            expect(tsconfig.compilerOptions.types).toContain('node');
            expect(tsconfig.compilerOptions.types).toContain('jest');
            const tsconfigApp = JSON.parse(stripJsonComments(testing_1.getFileContent(tree, 'apps/my-serveless-app/tsconfig.app.json')));
            expect(tsconfigApp.compilerOptions.outDir).toEqual('../../dist/out-tsc');
            expect(tsconfigApp.extends).toEqual('./tsconfig.json');
            const tslintJson = JSON.parse(stripJsonComments(testing_1.getFileContent(tree, 'apps/my-serveless-app/tslint.json')));
            expect(tslintJson.extends).toEqual('../../tslint.json');
        }));
    });
    describe('nested', () => {
        it('should update workspace.json', () => __awaiter(this, void 0, void 0, function* () {
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp', directory: 'myDir' }, appTree);
            const workspaceJson = workspace_1.readJsonInTree(tree, '/workspace.json');
            expect(workspaceJson.projects['my-dir-my-serveless-app'].root).toEqual('apps/my-dir/my-serveless-app');
            expect(workspaceJson.projects['my-dir-my-serveless-app'].architect.lint).toEqual({
                builder: '@angular-devkit/build-angular:tslint',
                options: {
                    tsConfig: [
                        'apps/my-dir/my-serveless-app/tsconfig.app.json',
                        'apps/my-dir/my-serveless-app/tsconfig.spec.json'
                    ],
                    exclude: ['**/node_modules/**', '!apps/my-dir/my-serveless-app/**']
                }
            });
            expect(workspaceJson.projects['my-dir-my-serveless-app-e2e']).toBeUndefined();
            expect(workspaceJson.defaultProject).toEqual('my-dir-my-serveless-app');
        }));
        it('should update nx.json', () => __awaiter(this, void 0, void 0, function* () {
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp', directory: 'myDir', tags: 'one,two' }, appTree);
            const nxJson = workspace_1.readJsonInTree(tree, '/nx.json');
            expect(nxJson).toEqual({
                npmScope: 'proj',
                projects: {
                    'my-dir-my-serveless-app': {
                        tags: ['one', 'two']
                    }
                }
            });
        }));
        it('should generate files', () => __awaiter(this, void 0, void 0, function* () {
            const hasJsonValue = ({ path, expectedValue, lookupFn }) => {
                const content = testing_1.getFileContent(tree, path);
                const config = JSON.parse(stripJsonComments(content));
                expect(lookupFn(config)).toEqual(expectedValue);
            };
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp', directory: 'myDir' }, appTree);
            // Make sure these exist
            [
                `apps/my-dir/my-serveless-app/jest.config.js`,
                'apps/my-dir/my-serveless-app/src/main.ts'
            ].forEach(path => {
                expect(tree.exists(path)).toBeTruthy();
            });
            // Make sure these have properties
            [
                {
                    path: 'apps/my-dir/my-serveless-app/tsconfig.json',
                    lookupFn: json => json.extends,
                    expectedValue: '../../../tsconfig.json'
                },
                {
                    path: 'apps/my-dir/my-serveless-app/tsconfig.app.json',
                    lookupFn: json => json.compilerOptions.outDir,
                    expectedValue: '../../../dist/out-tsc'
                },
                {
                    path: 'apps/my-dir/my-serveless-app/tsconfig.app.json',
                    lookupFn: json => json.compilerOptions.types,
                    expectedValue: ['node']
                },
                {
                    path: 'apps/my-dir/my-serveless-app/tslint.json',
                    lookupFn: json => json.extends,
                    expectedValue: '../../../tslint.json'
                }
            ].forEach(hasJsonValue);
        }));
    });
    describe('--unit-test-runner none', () => {
        it('should not generate test configuration', () => __awaiter(this, void 0, void 0, function* () {
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp', unitTestRunner: 'none' }, appTree);
            expect(tree.exists('apps/my-serveless-app/src/test-setup.ts')).toBeFalsy();
            expect(tree.exists('apps/my-serveless-app/src/test.ts')).toBeFalsy();
            expect(tree.exists('apps/my-serveless-app/tsconfig.spec.json')).toBeFalsy();
            expect(tree.exists('apps/my-serveless-app/jest.config.js')).toBeFalsy();
            const workspaceJson = workspace_1.readJsonInTree(tree, 'workspace.json');
            expect(workspaceJson.projects['my-serveless-app'].architect.test).toBeUndefined();
            expect(workspaceJson.projects['my-serveless-app'].architect.lint.options.tsConfig).toEqual(['apps/my-serveless-app/tsconfig.app.json']);
        }));
    });
    describe('frontendProject', () => {
        it('should configure proxy', () => __awaiter(this, void 0, void 0, function* () {
            appTree = testing_3.createApp(appTree, 'my-frontend');
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp', frontendProject: 'my-frontend' }, appTree);
            expect(tree.exists('apps/my-frontend/proxy.conf.json')).toBeTruthy();
            const serve = JSON.parse(tree.readContent('workspace.json')).projects['my-frontend'].architect.serve;
            expect(serve.options.proxyConfig).toEqual('apps/my-frontend/proxy.conf.json');
        }));
        it('should work with unnormalized project names', () => __awaiter(this, void 0, void 0, function* () {
            appTree = testing_3.createApp(appTree, 'myFrontend');
            const tree = yield testing_2.runSchematic('app', { name: 'myServelessApp', frontendProject: 'myFrontend' }, appTree);
            expect(tree.exists('apps/my-frontend/proxy.conf.json')).toBeTruthy();
            const serve = JSON.parse(tree.readContent('workspace.json')).projects['my-frontend'].architect.serve;
            expect(serve.options.proxyConfig).toEqual('apps/my-frontend/proxy.conf.json');
        }));
    });
});
