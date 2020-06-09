import { getLazyLoadPictureTagPlugin } from './scully-plugin-lazy-load-picture-tag';

describe('scullyLazyLoadPictureTagPlugin', () => {
  it('should work', () => {
    expect(getLazyLoadPictureTagPlugin()).toEqual('lazyLoadPictureTag');
  });
});
