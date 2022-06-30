import { Schema } from './schema';
import { IApplicationStackEnvironmentConfig } from '../types';

export interface NormalizedSchema extends Schema {
  parsedTags: string[];
  appProjectRoot: string;
  // projectName: string;
  // projectRoot: string;
  // projectDirectory: string;
  // skipFormat: boolean;
}
