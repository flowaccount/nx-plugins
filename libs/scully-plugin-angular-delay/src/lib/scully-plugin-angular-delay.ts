// import {
//   registerPlugin,
//   scullyConfig,
// } from 'D:/projects/flowaccount/flowaccount.workspace/node_modules/@scullyio@scullyio/scully/src/';
import { registerPlugin, scullyConfig } from '@scullyio/scully';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

const DelayAngular = 'delayAngular';
// const validator = async (conf) => [];
registerPlugin('render', DelayAngular, delayAngularPlugin);

interface DelayAngularPluginOptions {
  routesBlacklist?: { route: string; removeAngular?: boolean }[];
  delayMilliseconds?: number;
  tsConfigPath?: string;
  distFolder?: string;
}

let RoutesBlacklist = [];
let DelayMilliseconds = 0;
let TSConfigPath: string | null = null;
let DistFolder: string | null = null;

export function getDelayAngularPlugin({
  routesBlacklist,
  delayMilliseconds,
  tsConfigPath,
  distFolder,
}: DelayAngularPluginOptions = {}) {
  if (routesBlacklist) {
    RoutesBlacklist = routesBlacklist;
  }
  if (delayMilliseconds) {
    DelayMilliseconds = delayMilliseconds;
  }
  if (tsConfigPath) {
    TSConfigPath = tsConfigPath;
  }
  if (distFolder) {
    DistFolder = distFolder;
  }

  return DelayAngular;
}

function escapeRegExp(string): string {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function delayAngularPlugin(html, routeObj) {
  const blacklistRoute = RoutesBlacklist.find(
    (obj) => obj.route === routeObj.route
  );
  if (blacklistRoute && !blacklistRoute.removeAngular) {
    return Promise.resolve(html);
  }
  let tsConfigPath: string;
  if (TSConfigPath) {
    tsConfigPath = TSConfigPath;
  } else {
    tsConfigPath = scullyConfig.projectRoot
      ? join(scullyConfig.projectRoot, 'tsconfig.json')
      : 'tsconfig.json';
  }
  if (!existsSync(tsConfigPath)) {
    const notsconfigError = `No tsconfig file ${tsConfigPath} found`;
    console.error(notsconfigError);
    throw new Error(notsconfigError);
  }
  // const tsConfig = JSON.parse(
  //   readFileSync(tsConfigPath, { encoding: 'utf8' }).toString()
  // );

  const distFolder = DistFolder ? DistFolder : scullyConfig.distFolder;
  // let isEs5Config = false;
  // let statsJsonPath = join(distFolder, 'stats-es2015.json');
  // if (tsConfig.compilerOptions.target === 'es5') {
  //   isEs5Config = true;
  const statsJsonPath = join(distFolder, 'stats.json');
  //}

  if (!existsSync(statsJsonPath)) {
    const noStatsJsonError = `A ${'stats'}.json is required for the 'delayAngular' plugin.
Please run 'ng build' with the '--stats-json' flag`;
    console.error(noStatsJsonError);
    throw new Error(noStatsJsonError);
  }

  const scullyDelayAngularStatsJsonPath = join(
    distFolder,
    'scully-plugin-angular-delay-stats.json'
  );
  let scullyDelayAngularStatsJson = [];
  if (!existsSync(scullyDelayAngularStatsJsonPath)) {
    const errorCreatingScullyDelayAngularStatsJsonError =
      'The scully-plugin-angular-delay-stats.json could not be created';
    try {
      scullyDelayAngularStatsJson = JSON.parse(
        readFileSync(statsJsonPath, { encoding: 'utf8' }).toString()
      ).assets;
      writeFileSync(
        scullyDelayAngularStatsJsonPath,
        JSON.stringify(scullyDelayAngularStatsJson)
      );
    } catch (e) {
      console.error(e);
      console.error(errorCreatingScullyDelayAngularStatsJsonError);
      throw new Error(errorCreatingScullyDelayAngularStatsJsonError);
    }
  } else {
    scullyDelayAngularStatsJson = JSON.parse(
      readFileSync(scullyDelayAngularStatsJsonPath, {
        encoding: 'utf8',
      }).toString()
    );
  }
  const assetsList = scullyDelayAngularStatsJson
    .filter((entry) => {
      return entry['name'].includes('.js');
    })
    .map((entry) => entry['name']);
  // assetsList = [
  //   ...assetsList,
  //   ...assetsList.map(asset => {
  //     return asset.includes('-es5')
  //       ? asset.replace('-es5', '-es2015')
  //       : asset.replace('-es2015', '-es5');
  //   })
  // ];
  if (blacklistRoute && blacklistRoute.removeAngular) {
    assetsList.forEach((entry) => {
      const regex = new RegExp(
        `<script( charset="?utf-8"?)? src="?${escapeRegExp(
          entry
        )}"?( type="?module"?)?( nomodule(="")?)?( defer(="")?)?><\\/script>`,
        'gmi'
      );
      html = html.replace(regex, '');
    });
    return Promise.resolve(html);
  } else {
    let appendScript = `
    function appendScript(entry) {
      var s = document.createElement("script");
      s.setAttribute("type", "module");
      s.src = entry;
      // s.onload = function () {
      //   console.log('script is loaded!')
      // };
      document.body.appendChild(s);
    }
    var scriptsToLoad = [];
    window.addEventListener('load', function(event) {
        setTimeout( function() {
          scriptsToLoad.forEach(entry => {
            appendScript(entry);
          });
        }, ${DelayMilliseconds});
      });
    `;
    let sorted = [];
    const mainJs = [];
    const polyFillsJs = [];
    const otherJs = [];
    const scriptsArray = [];
    assetsList.forEach((entry) => {
      const regex = new RegExp(
        `<script( charset="?utf-8"?)? src="?${escapeRegExp(
          entry
        )}"?( type="?module"?)?( nomodule(="")?)?( defer(="")?)?><\\/script>`,
        'gmi'
      );
      const match = html.match(regex);
      if (match && match.length > 0) {
        // console.log(`matched script, putting it in, ${entry}`)
        scriptsArray.push(entry);
      }
      html = html.replace(regex, '');
    });
    scriptsArray.forEach(function (x, index) {
      if (x.startsWith('runtime')) {
        sorted.splice(0, 0, x);
      } else if (x.startsWith('main')) {
        mainJs.push(x);
      } else if (x.startsWith('polyfills')) {
        polyFillsJs.push(x);
      } else if (x.startsWith('vendor')) {
        sorted.splice(1, 0, x);
      } else {
        otherJs.push(x);
      }
      if (index === scriptsArray.length - 1) {
        polyFillsJs.forEach((s) => {
          sorted.splice(1, 0, s);
        });
        sorted = sorted.concat(mainJs);
        sorted = sorted.concat(otherJs);
      }
    });
    appendScript += `scriptsToLoad = ${JSON.stringify(sorted)}`;

    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const s = doc.createElement('script');
    s.innerHTML = appendScript;
    doc.body.append(s);
    return Promise.resolve(dom.serialize());
  }
}
