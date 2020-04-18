import { AwsCdkSchematicsAdapter } from './base-aws-cdk';
import { BaseSchema } from './base-schema';
import { BaseNormalizedSchema } from './base-normalized-schema';
import { Rule } from '@angular-devkit/schematics';
import {
  updateWorkspace,
  toFileName,
  projectRootDir,
  ProjectType
} from '@nrwl/workspace';

export function normalizeOptions(options: BaseSchema): BaseNormalizedSchema {
  const name = toFileName(options.project);
  const projectDirectory = options.directory
    ? `${toFileName(options.directory)}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${projectRootDir(
    ProjectType.Application
  )}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map(s => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags
  };
}

export function updateWorkspaceJson(
  applicationConfig: AwsCdkSchematicsAdapter,
  normalizedOptions: BaseNormalizedSchema
): Rule {
  return updateWorkspace(workspace => {
    const project = workspace.projects[normalizedOptions.projectName];
    workspace.projects[normalizedOptions.projectName] = project;
    project.architect.deploy = applicationConfig.getDeployConfiguration(
      normalizedOptions
    );
    project.architect.destroy = applicationConfig.getDestroyConfiguration(
      normalizedOptions
    );
    project.architect.synth = applicationConfig.getSynthConfiguration(
      normalizedOptions
    );
    project.architect.offline = applicationConfig.getOfflineConfiguration(
      normalizedOptions
    );
  });
}
