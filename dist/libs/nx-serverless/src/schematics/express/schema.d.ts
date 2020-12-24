import { BaseSchema } from '../utils';

export interface Schema extends BaseSchema {
  name: string;
  skipPackageJson: boolean;
  directory?: string;
  unitTestRunner: 'jest' | 'none';
  linter: Linter;
  tags?: string;
  frontendProject?: string;
  skipInstall: boolean;
  initExpress: boolean;
}
