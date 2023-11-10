import * as path from 'path';
import {
  addProjectConfiguration,
  generateFiles,
  joinPathFragments,
  names,
  offsetFromRoot,
  Tree,
} from '@nx/devkit';
import { Schema } from './schema';
import { ProjectType } from '@nx/workspace';
// import { toFileName } from '@nx/devkit';

import { normalize } from 'path';
import { NormalizedSchema } from './normalized-schema';

export function getBuildConfig(options: NormalizedSchema) {
  return {
    executor: '@nrwl/node:build',
    options: {
      outputPath: joinPathFragments(normalize('dist'), options.appProjectRoot),
      package: options.appProjectRoot,
      tsConfig: joinPathFragments(options.appProjectRoot, 'tsconfig.cdk.json'),
      fileReplacements: [
        {
          replace: `${joinPathFragments(
            normalize('dist'),
            options.appProjectRoot
          )}/src/environments/environment.ts`,
          with: `${joinPathFragments(
            normalize('dist'),
            options.appProjectRoot
          )}/src/environments/environment.staging.ts`,
        },
      ],
    },
    configurations: {
      production: {
        optimization: true,
        extractLicenses: true,
        inspect: false,
        fileReplacements: [
          {
            replace: `${joinPathFragments(
              normalize('dist'),
              options.appProjectRoot
            )}/src/environments/environment.ts`,
            with: `${joinPathFragments(
              normalize('dist'),
              options.appProjectRoot
            )}/src/environments/environment.production.ts`,
          },
        ],
      },
    },
  };
}

function getCdkConfig(options: NormalizedSchema, executor: string) {
  return {
    builder: `@flowaccount/nx-aws-cdk:${executor}`,
    options: {
      buildTarget: options.name + ':build',
      profile: options.profile,
      stackName: `staging-${options.name}`,
      debug: options.debug,
      verbose: options.verbose,
      output: `dist/cdkOutput/${options.appProjectRoot}/cdk.out`,
    },
    configurations: {
      staging: {
        buildTarget: options.name + `:${executor}:staging`,
      },
      production: {
        buildTarget: options.name + `:${executor}:production`,
      },
    },
  };
}

function getSynthConfig(options: NormalizedSchema) {
  return getCdkConfig(options, 'synth');
}

function getDiffConfig(options: NormalizedSchema) {
  return getCdkConfig(options, 'diff');
}

function getDeployConfig(options: NormalizedSchema) {
  return getCdkConfig(options, 'deploy');
}

function getDestroyConfig(options: NormalizedSchema) {
  return getCdkConfig(options, 'destroy');
}

export function updateWorkspaceJson(
  host: Tree,
  options: NormalizedSchema
): void {
  const project = {
    root: options.appProjectRoot,
    sourceRoot: joinPathFragments(options.appProjectRoot, 'src'),
    projectType: ProjectType.Application,
    prefix: options.name,
    schematics: {},
    targets: <any>{},
    tags: <any>{},
  };

  project.targets.build = getBuildConfig(options);
  project.targets.serve = getSynthConfig(options);
  project.targets.diff = getDiffConfig(options);
  project.targets.deploy = getDeployConfig(options);
  project.targets.destroy = getDestroyConfig(options);
  project.tags = options.parsedTags;
  addProjectConfiguration(host, options.name, project);
}

export function normalizeOptions(options: Schema): NormalizedSchema {
  const appDirectory = options.directory
    ? `${names(options.directory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
  const appProjectRoot = joinPathFragments(normalize('apps'), appDirectory);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    name: names(appProjectName).fileName,
    // frontendProject: options.frontendProject
    //   ? toFileName(options.frontendProject)
    //   : undefined,
    appProjectRoot,
    parsedTags,
  };
}
