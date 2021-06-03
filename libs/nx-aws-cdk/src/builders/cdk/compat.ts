import { convertNxExecutor } from '@nrwl/devkit';

import { cdkCmdRunner } from './cdk.impl';

export default convertNxExecutor(cdkCmdRunner);
