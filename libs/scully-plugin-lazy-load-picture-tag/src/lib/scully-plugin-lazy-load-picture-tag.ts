import { registerPlugin } from '@scullyio/scully';
import { JSDOM } from 'jsdom';

const LazyLoadPictureTag = 'lazyLoadPictureTag';
registerPlugin('render', LazyLoadPictureTag, scullyLazyLoadPictureTagPlugin);

interface LazyLoadPictureTagPluginOptions {
  imagePlaceholder?: string;
}

let ImagePlaceholder: string = null;
export function getLazyLoadPictureTagPlugin({
  imagePlaceholder
}: LazyLoadPictureTagPluginOptions = {}) {
  if (imagePlaceholder) {
    ImagePlaceholder = imagePlaceholder;
  }
  return LazyLoadPictureTag;
}

async function scullyLazyLoadPictureTagPlugin(html, route) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const entry = doc.getElementsByTagName('picture');
  // can be added when loading="lazy" is supported in more browsers
  //   for (var i = 0; i < imgEl.length; i++) {
  //     imgEl[i].setAttribute('loading', 'lazy');
  //   }
  for (let i = 0; i < entry.length; i++) {
    const img = entry[i].getElementsByTagName('img')[0];
    const src = img.getAttribute('src');
    if (src) {
      img.setAttribute('data-src', src);
      if (ImagePlaceholder) {
        img.setAttribute('src', ImagePlaceholder);
      } else {
        img.removeAttribute('src');
      }
    }
    const sources = entry[i].getElementsByTagName('source');
    const srcsets = [];
    const sourceCount = sources.length;
    for (let j = 0; j < sourceCount; j++) {
      const source = sources[0];
      const srcset = source.getAttribute('srcset');
      const type = source.getAttribute('type');
      if (srcset) {
        const obj = {};
        obj
        if (type) {
          obj[type] = srcset;
        } else {
          obj[0] = srcset;

        }
        srcsets.push(obj);
        source.remove();
      }
    }
    entry[i].setAttribute('data-srcset', JSON.stringify(srcsets));
    entry[i].classList.add('lazyload');
  }
  const lib = doc.createElement('script');
  lib.src = 'https://cdn.jsdelivr.net/npm/lazy-load-picture@0.0.1/lazy-load-picture.min.js';
  const s = doc.createElement('script');
  s.innerHTML = `
    (() => { 
      document.addEventListener('readystatechange',function(){
          if(document.readyState === 'complete'){
              setTimeout(() => {
                lazyload();
              },0)
          }
      })
    })();
    `;
  doc.body.append(lib);
  doc.body.append(s);
  return dom.serialize();
};
