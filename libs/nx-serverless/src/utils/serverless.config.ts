import { BuildBuilderOptions } from './types';
import { ServerlessWrapper } from './serverless';
import * as _ from 'lodash';
import * as ts from 'typescript';
import * as upath from 'upath';
import { writeJsonFile } from '@nrwl/workspace/src/utils/fileutils';
import { join, relative } from 'path';
import ignore from 'ignore';
import { logger } from '@nrwl/devkit';

const defaultExcludes = ['.serverless_plugins/**'];

export function consolidateExcludes(options: BuildBuilderOptions) {
  const packageExcludes =
    ServerlessWrapper.serverless.service.package.exclude || [];
  // add local service plugins Path
  let pluginsLocalPath =
    ServerlessWrapper.serverless.pluginManager.parsePluginsObject(
      ServerlessWrapper.serverless.service.plugins
    ).localPath;
  pluginsLocalPath = /^win/.test(process.platform)
    ? upath.toUnix(pluginsLocalPath)
    : pluginsLocalPath;
  const localPathExcludes = pluginsLocalPath.localPath
    ? [pluginsLocalPath.localPath]
    : [];
  // add layer paths
  // const layerExcludes = excludeLayers
  //   ? ServerlessWrapper.serverless.service
  //       .getAllLayers()
  //       .map(layer => `${ServerlessWrapper.serverless.service.getLayer(layer).path}/**`)
  //   : [];
  // add defaults for exclude
  const excludeList = _.union(
    defaultExcludes,
    localPathExcludes,
    packageExcludes
    // layerExcludes,
    // functionExcludes
  );
  // const parsedTSConfig = readTsConfig(options.tsConfig);
  const parsedTSConfig = ts.readConfigFile(
    options.tsConfig,
    ts.sys.readFile
  ).config;
  const appRoot = options.sourceRoot.replace('src', '');
  logger.info(`Adding excluding list to tsconfig ${excludeList}`);
  if (excludeList.length > 0) {
    /* Handle excludes for handlers */
    logger.info('Checking if exclude paths overlaps with handlers...');
    const handlerPaths: string[] = Object.values(options.files).map(
      (m: string) => relative(appRoot, m)
    );
    const ig = ignore().add(excludeList);
    const filteredPaths = ig.filter(handlerPaths);
    if (filteredPaths.length < handlerPaths.length) {
      logger.warn(
        'There is an overlap!\nPlease make sure you are purposely doing this!\nI will build, taking your handlers defined in serverless.yml/serverless.ts as the only "entry points"!'
      );
      logger.warn(`handlers ---> ${JSON.stringify(options.files)}`);
    }
    Object.keys(options.files).forEach((handlerEntryName) => {
      if (
        filteredPaths.indexOf(
          relative(appRoot, options.files[handlerEntryName])
        ) === -1
      ) {
        delete options.files[handlerEntryName];
      }
    });
    logger.warn(`you are left with --> ${JSON.stringify(options.files)}`);
    if (Object.keys(options.files).length === 0) {
      throw `Please check your exclude paths --> ${JSON.stringify(
        excludeList
      )}\nThere needs to be at least one handler to be compiled!`;
    }
    /* Handle excludes for handlers */
    // check for overlapping of files being excluded here ...
    if (!parsedTSConfig.exclude) {
      parsedTSConfig.exclude = [];
    }
    parsedTSConfig.exclude = parsedTSConfig.exclude.concat(excludeList);
  } //  context.workspaceRoot,
  const tmpTsConfigPath = join(appRoot, 'tsconfig.serverless.nx-tmp');
  logger.info(
    `writing tsconfig.serverless.nx-tmp with added excludeLists to ${tmpTsConfigPath}`
  );
  writeJsonFile(tmpTsConfigPath, parsedTSConfig);
  return tmpTsConfigPath;
}
