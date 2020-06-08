import { getDelayAngularPlugin } from './scully-plugin-angular-delay';

describe('scullyAngularDelayPlugin', () => {
  it('should work', () => {
    expect(getDelayAngularPlugin({
      routesBlacklist: [], delayMilliseconds: 1500})).toEqual('delayAngular');
  });
});
