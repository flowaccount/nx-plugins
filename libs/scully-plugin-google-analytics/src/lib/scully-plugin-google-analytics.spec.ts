import { scullyPluginGoogleAnalytics } from './scully-plugin-google-analytics';

describe('scullyPluginGoogleAnalytics', () => {
  it('should work', () => {
    expect(scullyPluginGoogleAnalytics()).toEqual(
      'scully-plugin-google-analytics'
    );
  });
});
