import { convertNxExecutor } from '@nx/devkit';

import { destroyExecutor } from './destroy.impl';

export default convertNxExecutor(destroyExecutor);
