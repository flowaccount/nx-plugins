import { convertNxExecutor } from '@nrwl/devkit';

import { destroyExecutor } from './destroy.impl';

export default convertNxExecutor(destroyExecutor);
