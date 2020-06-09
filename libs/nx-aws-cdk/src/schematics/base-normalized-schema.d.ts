export interface BaseNormalizedSchema {
  name: string;
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  skipFormat: boolean;
}
