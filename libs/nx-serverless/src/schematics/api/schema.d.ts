import { Linter } from '@nrwl/workspace';
import { BaseSchema } from '../utils';
export interface Schema extends BaseSchema {
  name: string;
  skipPackageJson: boolean;
  directory?: string;
  unitTestRunner: 'jest' | 'none';
  linter: Linter;
  tags?: string;
  frontendProject?: string;
  baseWorkspaceTsConfig?: boolean;
}
