import { convertNxExecutor } from '@nrwl/devkit';

import { compileExecutor } from './compile.impl';

export default convertNxExecutor(compileExecutor);
