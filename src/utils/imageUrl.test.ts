import { extractImageFileName, resolveImageDisplayUrl } from './imageUrl';

describe('imageUrl', () => {
  const apiBase = 'https://241runners-api-v2.azurewebsites.net';

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_URL = apiBase;
  });

  it('resolves Azure blob URLs through the API image proxy', () => {
    const blobUrl =
      'https://account.blob.core.windows.net/images/abc-123.jpg?sv=2021-06-08';
    expect(resolveImageDisplayUrl(blobUrl)).toBe(
      `${apiBase}/api/ImageUpload/abc-123.jpg`
    );
  });

  it('extracts file names from API proxy URLs', () => {
    expect(
      extractImageFileName(`${apiBase}/api/ImageUpload/my-photo.png`)
    ).toBe('my-photo.png');
  });

  it('passes through local file URIs for immediate preview', () => {
    expect(resolveImageDisplayUrl('file:///var/mobile/photo.jpg')).toBe(
      'file:///var/mobile/photo.jpg'
    );
  });

  it('rewrites stale Render ImageUpload hosts to the current API', () => {
    expect(
      resolveImageDisplayUrl(
        'https://241runners-api.onrender.com/api/ImageUpload/bd7ecf80-d82c-4934-b560-899c8f949e56.jpg'
      )
    ).toBe(`${apiBase}/api/ImageUpload/bd7ecf80-d82c-4934-b560-899c8f949e56.jpg`);
  });
});
