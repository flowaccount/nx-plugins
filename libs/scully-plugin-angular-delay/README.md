# scully-plugin-angular-delay

I wrote this as an :paperclip: `angular-paperclip` :paperclip: experiment from the talk by **Misko Hevery (@mhevery)** from the [Keynote in NGCONF 2019](https://nitayneeman.com/posts/all-talks-from-ng-conf-2019/#keynote-1)

It is to help demonstrate the power of Resuming states when rendering angular applications on the client-side which is already pre-rendered from the server-side. In this case, using scully.

By delaying the Angular application from bootstrapping, I am allowing clients to interact with the site before rendering the Angular javascript codes, hence reducing the `Time to interaction` metrics for performance calculated by lighthouse.

However the states to be resume have to be manually put in by using `State Decorators`

Read more at this article --> [Angular Paperclip Experiment](https://wickstargazer.com/angular-paperclip-experiment)

## Installation

To install this library with `npm` run

```bash
npm install scully-plugin-angular-delay --save-dev
```

or with `yarn`

```bash
yarn add scully-plugin-angular-delay --dev
```

## Usage

- Add this to your `scully.config.ts` file

```javascript
import { getDelayAngularPlugin } from '@flowaccount/scully-plugin-angular-delay';

const postRenderers = [
  getDelayAngularPlugin({
    routesBlacklist: [
      { route: '/pricing', removeAngular: false },
      { route: '/functions', removeAngular: true }
    ],
    delayMilliseconds: 1500
  })
];

export const config: ScullyConfig = {
  routes: {},
  defaultPostRenderers: postRenderers
};
```

- If your tsconfig or dist folder lives outside of the scully project root, you can specify the paths

```javascript
const postRenderers = [
  getDelayAngularPlugin({
    tsConfigPath: '../../tsconfig.json',
    distFolder: '../../dist/app'
  })
];
```

_Build your app with the `--stats-json` flag enabled as the plugin needs to know which assets have been build for your app. Then just run the Scully command._

```bash
yarn ng build --configuration=prod --stats-json
yarn scully
```

This is an adaptation from [scully-plugin-disable-angular](https://github.com/samvloeberghs/kwerri-oss/blob/master/projects/scully-plugin-disable-angular)
