import { ExecutorContext } from '@nrwl/devkit';
import { appRootPath } from '@nrwl/tao/src/utils/app-root';

import { resolve } from 'path';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext,
  awscdkClient: AwsCdkClient = new AwsCdkClient(awscdkFactory())
) {
  const nxProjectConfiguration = getExecutedProjectConfiguration(context);
  awscdkClient.cwd = resolve(appRootPath, nxProjectConfiguration.root);
  awscdkClient.printSdkVersion();
  const projectFilePath = resolve(
    appRootPath,
    await getProjectFileForNxProject(nxProjectConfiguration)
  );
  options.output = options.output
    ? resolve(appRootPath, options.output)
    : undefined;

  awscdkClient.build(
    projectFilePath,
    Object.keys(options).map((x) => ({
      flag: x as awscdkBuildFlags,
      value: (options as Record<string, string | boolean>)[x],
    }))
  );

  return {
    success: true,
  };
}
