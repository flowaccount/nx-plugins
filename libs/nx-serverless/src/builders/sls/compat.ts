import { convertNxExecutor } from '@nrwl/devkit';

import { slsExecutor } from './sls.impl';

export default convertNxExecutor(slsExecutor);
