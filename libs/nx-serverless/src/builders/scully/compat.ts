import { convertNxExecutor } from '@nrwl/devkit';

import { scullyCmdRunner } from './scully.impl';

export default convertNxExecutor(scullyCmdRunner);
