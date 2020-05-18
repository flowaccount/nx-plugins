import { registerPlugin, scullyConfig } from '@scullyio/scully';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

const DelayAngular = 'delayAngular';
registerPlugin('render', DelayAngular, delayAngularPlugin);

interface DelayAngularPluginOptions {
  routesBlacklist?: { route: string, removeAngular?: boolean }[];
  delayMilliseconds?: number;
}

let RoutesBlacklist = [];
let DelayMilliseconds = 0;

export function getDelayAngularPlugin({
  routesBlacklist,
  delayMilliseconds
}: DelayAngularPluginOptions = {}) {
  if (routesBlacklist) {
    RoutesBlacklist = routesBlacklist;
  }
  if (delayMilliseconds) {
    DelayMilliseconds = delayMilliseconds;
  }

  return DelayAngular;
}

function escapeRegExp(string): string {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

async function delayAngularPlugin(html, routeObj) {
  const blacklistRoute = RoutesBlacklist.find(obj => obj.route === routeObj.route);
  if (blacklistRoute && !blacklistRoute.removeAngular) {
    return Promise.resolve(html);
  }
  const tsConfigPath = scullyConfig.projectRoot ? join(scullyConfig.projectRoot, 'tsconfig.json') : 'tsconfig.json';
  if (!existsSync(tsConfigPath)) {
    const notsconfigError = `No tsconfig file ${tsConfigPath} found`
    console.error(notsconfigError);
    throw new Error(notsconfigError);
  }
  const tsConfig = JSON.parse(readFileSync(tsConfigPath, { encoding: 'utf8' }).toString());

  let isEs5Config = false;
  let statsJsonPath = join(scullyConfig.distFolder, 'stats-es2015.json');
  if (tsConfig.compilerOptions.target === 'es5') {
    isEs5Config = true;
    statsJsonPath = join(scullyConfig.distFolder, 'stats.json');
  }

  if (!existsSync(statsJsonPath)) {
    const noStatsJsonError = `A ${isEs5Config ? 'stats' : 'stats-es2015'}.json is required for the 'delayAngular' plugin.
Please run 'ng build' with the '--stats-json' flag`;
    console.error(noStatsJsonError);
    throw new Error(noStatsJsonError);
  }

  const scullyDelayAngularStatsJsonPath = join(scullyConfig.distFolder, 'scully-plugin-angular-delay-stats.json');
  let scullyDelayAngularStatsJson = [];
  if (!existsSync(scullyDelayAngularStatsJsonPath)) {
    const errorCreatingScullyDelayAngularStatsJsonError = 'The scully-plugin-angular-delay-stats.json could not be created';
    try {
      scullyDelayAngularStatsJson = JSON.parse(readFileSync(statsJsonPath, { encoding: 'utf8' }).toString()).assets;
      writeFileSync(scullyDelayAngularStatsJsonPath, JSON.stringify(scullyDelayAngularStatsJson));
    } catch (e) {
      console.error(e);
      console.error(errorCreatingScullyDelayAngularStatsJsonError);
      throw new Error(errorCreatingScullyDelayAngularStatsJsonError);
    }
  } else {
    scullyDelayAngularStatsJson = JSON.parse(readFileSync(scullyDelayAngularStatsJsonPath, { encoding: 'utf8' }).toString());
  }

  let assetsList = scullyDelayAngularStatsJson.filter(entry => {
    return entry['name'].includes('.js') && (
      entry['name'].includes('-es5') || entry['name'].includes('-es2015')
    );
  }).map(entry => entry['name']);
  assetsList = [...assetsList, ...assetsList.map(asset => {
    return asset.includes('-es5') ?
      asset.replace('-es5', '-es2015') :
      asset.replace('-es2015', '-es5');
  })];
  if (blacklistRoute && blacklistRoute.removeAngular) {
    assetsList.forEach(entry => {
      const regex = new RegExp(`<script( charset="?utf-8"?)? src="?${escapeRegExp(entry)}"?( type="?module"?)?( nomodule(="")?)?( defer(="")?)?><\/script>`, 'gmi');
      html = html.replace(regex, '');
    });
    return Promise.resolve(html);
  } else {
    let appendScript = `
    function appendScript(entry) {
      var s = document.createElement("script");
      if(pattes2015.test(entry)) {
        s.setAttribute("type", "module");
      } else if(pattes5.test(entry)) {
        s.setAttribute("nomodule", "");
        s.setAttribute("defer", "");
      }
      s.src = entry;
      s.onload = function () {
        console.log('script is loaded!')
      };
      document.body.appendChild(s);
    }
    var scriptsToLoad = [];
    var pattes2015 = new RegExp("-es2015");
    var pattes5 = new RegExp("-es5");
    window.addEventListener('load', function(event) {
        setTimeout( function() {
          scriptsToLoad.forEach(entry => {
            appendScript(entry);
          });
        }, ${DelayMilliseconds});
      });
    `
    assetsList.forEach(entry => {
      const regex = new RegExp(`<script( charset="?utf-8"?)? src="?${escapeRegExp(entry)}"?( type="?module"?)?( nomodule(="")?)?( defer(="")?)?><\/script>`, 'gmi');
      html = html.replace(regex, '');
      if (entry.indexOf('main-') > -1 || entry.indexOf('runtime-') > -1 || entry.indexOf('polyfills-') > -1) {
        appendScript += `scriptsToLoad.push("${entry}");`
      }
    });
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const s = doc.createElement('script');
    s.innerHTML = appendScript;
    doc.body.append(s);
    return Promise.resolve(dom.serialize());
  }
};
