
import { cdkDeployFlags } from '@flowaccount/aws-cdk-core'
import { CdkArguments } from '../../models/cdk-arguments'
export type DeployExecutorSchema = 
   { [key in cdkFlags]?: string }
 & { [key in cdkDeployFlags]?: string }
 & CdkArguments
   