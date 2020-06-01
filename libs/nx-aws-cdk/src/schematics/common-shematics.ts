import { AwsCdkSchematicsAdapter } from './base-aws-cdk';
import { BaseSchema } from './base-schema';
import { BaseNormalizedSchema } from './base-normalized-schema';
import { Rule } from '@angular-devkit/schematics';
import {
  updateWorkspace,
  toFileName,
  projectRootDir,
  ProjectType,
  updateWorkspaceInTree
} from '@nrwl/workspace';
import { join } from 'path';

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
  console.log(parsedTags, options.tags);
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
  return updateWorkspaceInTree(workspaceJson => {
    let project = workspaceJson.projects[normalizedOptions.projectName];
    if (!project) {
      project = {
        root: normalizedOptions.projectRoot,
        sourceRoot: join(normalizedOptions.projectRoot, 'src'),
        projectType: 'application',
        prefix: normalizedOptions.projectName,
        schematics: {},
        architect: <any>{}
      };
    }
    project.architect.deploy = applicationConfig.getDeployConfiguration(
      normalizedOptions
    );
    project.architect.destroy = applicationConfig.getDestroyConfiguration(
      normalizedOptions
    );
    project.architect.synth = applicationConfig.getSynthConfiguration(
      normalizedOptions
    );
    if (applicationConfig.getOfflineConfiguration) {
      project.architect.offline = applicationConfig.getOfflineConfiguration(
        normalizedOptions
      );
    }
    workspaceJson.projects[normalizedOptions.projectName] = project;
    workspaceJson.defaultProject =
      workspaceJson.defaultProject || normalizedOptions.projectName;
    return workspaceJson;
  });
}
