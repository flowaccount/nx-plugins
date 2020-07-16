# scully-plugin-google-analytics

## Installation

To install this library with `npm` run

```bash
npm install @flowaccount/scully-plugin-google-analytics --save-dev
```

or with `yarn`

```bash
yarn add @flowaccount/scully-plugin-google-analytics --dev
```

## Usage

- Add this to your `scully.config.ts` file

```javascript
import { getGoogleAnalyticsPlugin } from '@flowaccount/scully-plugin-google-analytics';

const postRenderers = [getGoogleAnalyticsPlugin({ gaTrackingId: 'xxxxxx-x' })];

export const config: ScullyConfig = {
  routes: {},
  defaultPostRenderers: postRenderers
};
```
