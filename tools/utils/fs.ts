import {
  readProjectsConfigurationFromProjectGraph,
  Workspaces,
} from '@nx/devkit';
import { readFileSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

export function existsSync(path: string) {
  let results;
  try {
    results = statSync(path);
  } catch {
    /* empty */
  }
  return !!results;
}

export function readJson(path: string) {
  return JSON.parse(readFileSync(path).toString());
}

export function writeJson(path: string, object: any) {
  return writeFileSync(path, JSON.stringify(object, null, 2));
}

export function readWorkspaceJson() {
  //readProjectsConfigurationFromProjectGraph
  return new Workspaces(join(__dirname, '../../')).readWorkspaceConfiguration();
}
