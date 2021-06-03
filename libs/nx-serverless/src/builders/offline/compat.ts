import { convertNxExecutor } from '@nrwl/devkit';

import { offlineExecutor } from './offline.impl';

export default convertNxExecutor(offlineExecutor);
