import { convertNxExecutor } from '@nx/devkit';

import { offlineExecutor } from './offline.impl';

export default convertNxExecutor(offlineExecutor);
