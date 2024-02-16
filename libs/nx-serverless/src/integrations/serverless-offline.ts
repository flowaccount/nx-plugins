import { NxFacade } from '../nrwl/nx-facade';

/**
 * Adds support to serverless-offline
 * @link https://www.npmjs.com/package/serverless-offline
 */
export function prepareOffline(serverless: Serverless.Instance, nx: NxFacade) {
  serverless.service.package.individually = false;
  console.log(nx.outputAbsolutePath)
  set(serverless, 'service.custom.serverless-offline.location', nx.outputAbsolutePath);
}

/**
 * Adds support to serverless-step-functions-offline
 * @link https://www.npmjs.com/package/serverless-step-functions-offline
 */
export function prepareStepOffline(serverless: Serverless.Instance, nx: NxFacade) {
  serverless.service.package.individually = false;
  set(serverless, 'service.custom.stepFunctionsOffline.location', nx.outputAbsolutePath);
}

/**
 * @link https://github.com/angus-c/just/tree/master/packages/object-safe-set
 */
function set(
  item: any[] | Record<string, any>,
  target: string | symbol | Array<string | symbol>,
  value: any,
): boolean {
  let props: (string | symbol)[];
  if (Array.isArray(target)) {
    props = target.slice(0);
  }
  if (typeof target == 'string') {
    props = target.split('.');
  }
  if (typeof target == 'symbol') {
    props = [target];
  }
  if (!Array.isArray(props)) {
    throw new Error('props arg must be an array, a string or a symbol');
  }
  const lastProp = props.pop();
  if (!lastProp) {
    return false;
  }
  let thisProp: string | symbol;
  while ((thisProp = props.shift())) {
    if (typeof item[thisProp] == 'undefined') {
      item[thisProp] = {};
    }
    item = item[thisProp];
    if (!item || typeof item != 'object') {
      return false;
    }
  }
  item[lastProp] = value;
  return true;
}