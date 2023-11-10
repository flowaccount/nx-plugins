import { convertNxExecutor } from '@nx/devkit';
import runExecutor from './synth.executor';

export default convertNxExecutor(runExecutor);
