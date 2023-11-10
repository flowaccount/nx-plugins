import { convertNxExecutor } from '@nx/devkit';

import { scullyCmdRunner } from './scully.impl';

export default convertNxExecutor(scullyCmdRunner);
