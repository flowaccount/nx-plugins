import { convertNxExecutor } from '@nx/devkit';

import { slsExecutor } from './sls.impl';

export default convertNxExecutor(slsExecutor);
