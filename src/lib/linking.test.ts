import {
  isPublicDeepLinkPath,
  normalizeCaseId,
  requiresAuthDeepLinkPath,
  resolveDeepLinkPath,
} from './linking';

describe('linking', () => {
  it('normalizes numeric and prefixed case ids', () => {
    expect(normalizeCaseId('1')).toBe('case_1');
    expect(normalizeCaseId('case_1')).toBe('case_1');
    expect(normalizeCaseId('case_42')).toBe('case_42');
  });

  it('maps custom scheme routes', () => {
    expect(resolveDeepLinkPath('org.runners241.app://map')).toBe('/map');
    expect(resolveDeepLinkPath('org.runners241.app://cases/case_1')).toBe('/cases/case_1');
    expect(resolveDeepLinkPath('org.runners241.app://cases/1')).toBe('/cases/case_1');
    expect(resolveDeepLinkPath('org.runners241.app://profile')).toBe('/profile');
    expect(resolveDeepLinkPath('org.runners241.app://signup')).toBe('/signup');
    expect(resolveDeepLinkPath('org.runners241.app://report-case')).toBe('/report-case');
    expect(resolveDeepLinkPath('org.runners241.app://report-sighting/case_1')).toBe(
      '/report-sighting/case_1'
    );
    expect(resolveDeepLinkPath('org.runners241.app://map?case=1')).toBe('/map?case=case_1');
  });

  it('maps website URLs to app routes', () => {
    expect(resolveDeepLinkPath('https://241runnersawareness.org/map.html')).toBe('/map');
    expect(resolveDeepLinkPath('https://www.241runnersawareness.org/login.html')).toBe('/login');
    expect(resolveDeepLinkPath('https://241runnersawareness.org/signup.html')).toBe('/signup');
    expect(resolveDeepLinkPath('https://241runnersawareness.org/case-detail.html?id=1')).toBe(
      '/cases/case_1'
    );
    expect(resolveDeepLinkPath('https://241runnersawareness.org/report-sighting.html?id=case_1')).toBe(
      '/report-sighting/case_1'
    );
    expect(resolveDeepLinkPath('https://241runnersawareness.org/my-cases.html')).toBe('/cases');
    expect(resolveDeepLinkPath('https://241runnersawareness.org/report-case.html')).toBe(
      '/report-case'
    );
  });

  it('classifies public vs auth-required routes', () => {
    expect(isPublicDeepLinkPath('/map')).toBe(true);
    expect(isPublicDeepLinkPath('/login')).toBe(true);
    expect(isPublicDeepLinkPath('/cases/case_1')).toBe(true);
    expect(requiresAuthDeepLinkPath('/profile')).toBe(true);
    expect(requiresAuthDeepLinkPath('/report-case')).toBe(true);
    expect(requiresAuthDeepLinkPath('/map')).toBe(false);
  });
});
