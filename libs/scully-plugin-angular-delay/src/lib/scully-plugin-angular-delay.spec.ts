import { getDelayAngularPlugin } from './scully-plugin-angular-delay';

describe('scullyAngularDelayPlugin', () => {
  it('should work', () => {
    const response: string = getDelayAngularPlugin({
      routesBlacklist: [],
      delayMilliseconds: 1500,
    });
    expect(response).toEqual('delayAngular');
  });
});
