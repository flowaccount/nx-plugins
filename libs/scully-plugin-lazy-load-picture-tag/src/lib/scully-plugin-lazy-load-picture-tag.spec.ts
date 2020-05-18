import { scullyLazyLoadPictureTagPlugin } from './scully-plugin-lazy-load-picture-tag';

describe('scullyLazyLoadPictureTagPlugin', () => {
  it('should work', () => {
    expect(scullyLazyLoadPictureTagPlugin()).toEqual(
      'scully-plugin-lazy-load-picture-tag'
    );
  });
});
