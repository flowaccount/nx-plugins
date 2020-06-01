import { registerPlugin, scullyConfig } from '@scullyio/scully';
import { JSDOM } from 'jsdom';

const GoogleAnalyticsPlugin = 'googleAnalyticsPlugin';
let GaTrackingId = 'xxxxxx';
registerPlugin('render', GoogleAnalyticsPlugin, scullyPluginGoogleAnalytics);

interface GoogleAnalyticsPluginOptions {
  gaTrackingId: string;
}

export function getGoogleAnalyticsPlugin({
  gaTrackingId
}: GoogleAnalyticsPluginOptions) {
  if (gaTrackingId) {
    GaTrackingId = gaTrackingId;
  }
  return GoogleAnalyticsPlugin;
}

async function scullyPluginGoogleAnalytics(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const tag = doc.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GaTrackingId}`;
  tag.setAttribute('defer', '');
  const s = doc.createElement('script');
  s.innerHTML = `
    (() => { 
      document.addEventListener('readystatechange',function(){
          if(document.readyState === 'complete'){
              setTimeout(() => {
                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                gtag('js', new Date());
                gtag('config', '${GaTrackingId}');
              },0)
          }
      })
    })();
    `;
  doc.body.append(tag);
  doc.body.append(s);
  return dom.serialize();
}
