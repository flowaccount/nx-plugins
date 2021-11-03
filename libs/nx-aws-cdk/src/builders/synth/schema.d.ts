import { cdkSynthFlags } from '@flowaccount/aws-cdk-core';
import { CdkArguments } from '../../models/cdk-arguments';
export type SynthExecutorSchema = { [key in cdkFlags]?: string } & {
  [key in cdkSynthFlags]?: string;
} & CdkArguments;
