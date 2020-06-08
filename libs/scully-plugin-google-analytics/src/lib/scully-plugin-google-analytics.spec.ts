import { getGoogleAnalyticsPlugin } from './scully-plugin-google-analytics';

describe('scullyPluginGoogleAnalytics', () => {
  it('should work', () => {
    expect(getGoogleAnalyticsPlugin({ gaTrackingId: 'xx-xxxxxx-1' })).toEqual(
      'googleAnalyticsPlugin'
    );
  });
});
