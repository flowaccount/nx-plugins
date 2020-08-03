# scully-plugin-lazy-load-picture-tag

I wrote this as an :paperclip: `angular-paperclip` :paperclip: experiment from the talk by **Misko Hevery (@mhevery)** from the [Keynote in NGCONF 2019](https://nitayneeman.com/posts/all-talks-from-ng-conf-2019/#keynote-1)

It is a lazy effort to lazy load images that lies int the `<picture>` tags. I am not sure why, since the `srcset` probably does that for you, but `lighthouse` stills complains about it. And instead of replacing all the possible tags in the code, I chose to lazy-load it using the adaptation for `lazyload` package that does the `img` tag instead.

You can specify the placeholder image when lazyloading the img, which is a nice touch for mobile slow 3g/4g :smile:

Read more about the experiment at this article --> [Angular Paperclip Experiment](https://wickstargazer.com/angular-paperclip-experiment)

## Installation

To install this library with `npm` run

```bash
npm install @flowaccount/scully-plugin-lazy-load-picture-tag --save-dev
```

or with `yarn`

```bash
yarn add @flowaccount/scully-plugin-lazy-load-picture-tag --dev
```

## Usage

- Add this to your `scully.config.ts` file

```javascript
import { getLazyLoadPictureTagPlugin } from '@flowaccount/scully-plugin-lazy-load-picture-tag';

const postRenderers = [
  getLazyLoadPictureTagPlugin({
    imagePlaceholder:
      'https://flowaccountcdn.com/new_landing/image/White_2px.jpg'
  })
];

export const config: ScullyConfig = {
  routes: {},
  defaultPostRenderers: postRenderers
};
```

```bash
yarn scully
```

This is an adaptation from [scully-plugin-disable-angular](https://github.com/samvloeberghs/kwerri-oss/blob/master/projects/scully-plugin-disable-angular)
