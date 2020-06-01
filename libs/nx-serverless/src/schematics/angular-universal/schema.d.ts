import { BaseSchema } from '../utils';

export interface Schema extends BaseSchema {
  project: string;
  addUniversal: boolean;
  skipInstall: boolean;
}
