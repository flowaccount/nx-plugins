import { ProjectsConfigurations } from '@nx/devkit';

import { execSync } from 'child_process';
import { existsSync } from 'fs';

import { readJson, readWorkspaceJson } from '../../utils';
import { PatchPackageVersions } from '../patch-package-versions';

export function PublishAll(version: string, tag = 'latest') {
  // const workspace: WorkspaceJsonConfiguration = readWorkspaceJson();
  const workspace: ProjectsConfigurations = readWorkspaceJson();
  const rootPkg = readJson('package.json');

  PatchPackageVersions(version, false);

  // execSync('npx nx run-many --all --target="build" --with-deps', {
  //   stdio: 'inherit',
  // });

  execSync('npx nx build aws-cdk-core', {
    stdio: 'inherit',
  });

  execSync('npx nx build aws-cdk-stack', {
    stdio: 'inherit',
  });

  execSync('npx nx build nx-aws-cdk', {
    stdio: 'inherit',
  });

  const projects = Object.values(workspace.projects);
  const environment = {
    ...process.env,
    NPM_CONFIG_REGISTRY: undefined,
  };

  execSync(
    `npm publish dist/libs/aws-cdk-core --tag=aws-cdk-core --access=public`,
    {
      stdio: 'inherit',
      env: environment,
    }
  );

  execSync(
    `npm publish dist/libs/aws-cdk-stack --tag=aws-cdk-stack --access=public`,
    {
      stdio: 'inherit',
      env: environment,
    }
  );

  execSync(
    `npm publish dist/libs/nx-aws-cdk --tag=nx-aws-cdk --access=public`,
    {
      stdio: 'inherit',
      env: environment,
    }
  );

  // projects.forEach((projectConfiguration, idx) => {
  //   const outputPath = projectConfiguration.targets?.build?.options?.outputPath;
  //   if (existsSync(`${outputPath}/package.json`)) {
  //     execSync(`npm publish ${outputPath} --tag=${tag} --access=public`, {
  //       stdio: 'inherit',
  //       env: environment,
  //     });
  //   }
  // });
}

if (require.main === module) {
  PublishAll(process.argv[2], process.argv[3] || 'latest');
}
