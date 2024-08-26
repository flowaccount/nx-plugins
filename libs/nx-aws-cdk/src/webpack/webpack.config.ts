//import * as nodeExternals  from 'webpack-node-externals';
import { composePlugins, withNx } from '@nx/webpack'
import { withExternals } from '../utils/with-externals';
//import type { Configuration } from 'webpack';

module.exports = composePlugins(
    withNx(),
    withExternals([/^aws-cdk-lib\//,/aws-cdk-stack\//,/^aws-cdk-core\//,/^nx-aws-cdk\//]),
    //withNode(),
);


