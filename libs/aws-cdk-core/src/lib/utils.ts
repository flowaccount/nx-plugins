import {
  cdkDeployFlags,
  cdkDeployOptions,
  cdkFlags,
  cdkOptions,
  cdkSynthFlags,
  cdkSynthOptions,
  iscdkDeployFlag,
  iscdkFlag,
  iscdkSynthFlag,
} from './types';
import { logger } from '@nrwl/devkit';

export function getParameterString(parameters: cmdLineParameter[]): string {
  logger.debug('preping parameters');
  return parameters.reduce((acc, current) => {
    if (typeof current.value === 'boolean' || !current.value) {
      if (current.value) {
        return acc + `--${current.flag} `;
      } else {
        return acc;
      }
    } else {
      return acc + `--${current.flag} "${current.value}" `;
    }
  }, '');
}

export type cmdLineParameter = {
  flag: string;
  value?: string | boolean;
};

export function getCdkOptions(options: {
  [key in cdkFlags]?: string;
}): cdkOptions {
  const cdkOption = Object.keys(options).map((x) => {
    if (iscdkFlag(x)) {
      return {
        flag: x as cdkFlags,
        value: (options as Record<string, string | boolean>)[x],
      };
    }
    return undefined;
  });
  return cdkOption.filter((o) => o != undefined);
}

export function getSynthOptions(options: {
  [key in cdkSynthFlags]?: string;
}): cdkSynthOptions {
  const cdkOption = Object.keys(options).map((x) => {
    if (iscdkSynthFlag(x)) {
      return {
        flag: x as cdkSynthFlags,
        value: (options as Record<string, string | boolean>)[x],
      };
    }
    return undefined;
  });
  return cdkOption.filter((o) => o != undefined);
}

export function getDeployOptions(options: {
  [key in cdkDeployFlags]?: string;
}): cdkDeployOptions {
  const cdkOption = Object.keys(options).map((x) => {
    if (iscdkDeployFlag(x)) {
      return {
        flag: x as cdkDeployFlags,
        value: (options as Record<string, string | boolean>)[x],
      };
    }
    return undefined;
  });
  return cdkOption.filter((o) => o != undefined);
}
