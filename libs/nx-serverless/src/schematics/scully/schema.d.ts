import { BaseSchema } from '../utils';

export interface Schema extends BaseSchema {
  project: string;
  addScully: boolean;
  skipInstall: boolean;
}
