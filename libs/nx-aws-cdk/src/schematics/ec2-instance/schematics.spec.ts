import { Tree } from '@angular-devkit/schematics';
import { createEmptyWorkspace } from '@nrwl/workspace/testing';
import { readJsonInTree } from '@nrwl/workspace';
import { runSchematic } from '../../utils/testing';

describe('ec2-instance app', () => {
    let appTree: Tree;
    beforeEach(async () => {
        appTree = Tree.empty();
        appTree = createEmptyWorkspace(appTree);
    });

    describe('not nested', () => {
        it('should update workspace.json', async () => {
            const tree = await runSchematic(
                'ec2-instance',
                { project: 'my-app', name: 'open-vpn', id: 'openVpn', imageId: 'xx-xxxxxx', instanceType: 't3.micro', keyName: 'test.pem', subnetId: 'xxx-xxxx-xxx', expressApp: false, ec2Instance: true },
                appTree
            );
            const workspaceJson = readJsonInTree(tree, '/workspace.json');
            const project = workspaceJson.projects['my-app'];
            expect(project.root).toEqual('apps/my-app');
            expect(project.architect).toEqual(
                jasmine.objectContaining({
                    cdk: {
                        builder: '@flowaccount/nx-aws-cdk:run',
                        options: {
                            waitUntilTargets: [],
                            buildTarget: 'my-app:build:production',
                            skipBuild: false,
                            main: 'cdk.ts',
                            tsConfig: 'apps/my-app/tsconfig.cdk.json',
                            outputFile: 'dist/apps/my-app/my-app.out',
                            stackNames: ['OpenVpnStack'],
                            processEnvironmentFile: 'env.json'
                        },
                        configurations: {
                            deploy: {
                                command: 'deploy'
                            },
                            destroy: {
                                command: 'destroy'
                            },
                            synth: { 
                                command: 'synth' 
                            }
                        }
                    }
                })
            );
        });
        it('should generate files', async () => {
            const tree = await runSchematic(
                'ec2-instance',
                { project: 'my-app', name: 'open-vpn', id: 'openVpn', imageId: 'xx-xxxxxx', instanceType: 't3.micro', keyName: 'test.pem', subnetId: 'xxx-xxxx-xxx', expressApp: false, ec2Instance: true },
                appTree
            );
            expect(tree.exists('apps/my-app/env.json')).toBeTruthy();
            expect(tree.exists('apps/my-app/src/ec2-stack.ts')).toBeTruthy();
            expect(tree.exists('apps/my-app/tsconfig.cdk.json')).toBeTruthy();
            expect(tree.exists('apps/my-app/cdk.ts')).toBeTruthy();
            const tsconfig = readJsonInTree(
                tree,
                'apps/my-app/tsconfig.cdk.json'
            );
            expect(tsconfig.compilerOptions.types).toContain('node');
            expect(tsconfig.files).toEqual(['cdk.ts']);
        });
    });
    describe('nested', () => {
        it('should update workspace.json', async () => {
            const tree = await runSchematic(
                'ec2-instance',
                { project: 'my-app', name: 'open-vpn', id: 'openVpn', imageId: 'xx-xxxxxx', instanceType: 't3.micro', keyName: 'test.pem', subnetId: 'xxx-xxxx-xxx', directory: 'myDir', expressApp: false, ec2Instance: true },
                appTree
            );
            const workspaceJson = readJsonInTree(tree, '/workspace.json');
            expect(workspaceJson.projects['my-dir-my-app'].root).toEqual(
                'apps/my-dir/my-app'
            );
            expect(workspaceJson.defaultProject).toEqual('my-dir-my-app');
        });

        it('should generate files', async () => {
            const tree = await runSchematic(
                'ec2-instance',
                { project: 'my-app', name: 'open-vpn', id: 'openVpn', imageId: 'xx-xxxxxx', instanceType: 't3.micro', keyName: 'test.pem', subnetId: 'xxx-xxxx-xxx', directory: 'myDir', expressApp: false, ec2Instance: true },
                appTree
            );
            [
                'apps/my-dir/my-app/env.json',
                'apps/my-dir/my-app/src/ec2-stack.ts',
                'apps/my-dir/my-app/tsconfig.cdk.json',
                'apps/my-dir/my-app/cdk.ts'
            ].forEach(path => {
                expect(tree.exists(path)).toBeTruthy();
            });
            const tsconfig = readJsonInTree(
                tree,
                'apps/my-dir/my-app/tsconfig.cdk.json'
            );
            expect(tsconfig.compilerOptions.types).toContain('node');
            expect(tsconfig.files).toEqual(['cdk.ts']);
        });
    });
});
