import { convertNxExecutor } from '@nx/devkit';

import { compileExecutor } from './compile.impl';

export default convertNxExecutor(compileExecutor);
