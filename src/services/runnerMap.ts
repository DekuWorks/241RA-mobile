import { ApiClient } from './apiClient';
import { PublicMapCase } from './cases';

type ApiRunner = {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  mapLatitude?: number | null;
  mapLongitude?: number | null;
  lastKnownLocation?: string | null;
  profileImageUrl?: string | null;
  updatedAt?: string | null;
};

export type ProfileMapResult = {
  mode: 'mine' | 'public';
  cases: PublicMapCase[];
  subtitle: string;
};

function toMapCase(runner: ApiRunner): PublicMapCase | null {
  const lat = runner.mapLatitude;
  const lng = runner.mapLongitude;
  if (lat == null || lng == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return null;
  }

  const displayName =
    runner.name?.trim() ||
    `${runner.firstName || ''} ${runner.lastName || ''}`.trim() ||
    `Runner #${runner.id}`;

  return {
    id: `runner_${runner.id}`,
    displayName,
    status: (runner.status || 'active').toLowerCase(),
    latitude: Number(lat),
    longitude: Number(lng),
    photoUrl: runner.profileImageUrl || null,
    lastSeenCity: runner.lastKnownLocation || 'Your runner',
    lastSeenState: '',
    lastSeenCityState: runner.lastKnownLocation || 'Your runner',
    updatedAt: runner.updatedAt || null,
    isOwnRunner: true,
  };
}

export const RunnerMapService = {
  async getUserRunnerMapCases(): Promise<PublicMapCase[]> {
    const data = await ApiClient.get<{ runners?: ApiRunner[] }>(
      '/api/v1/runner?page=1&pageSize=50'
    );
    const runners = Array.isArray(data.runners) ? data.runners : [];
    return runners.map(toMapCase).filter((item): item is PublicMapCase => item != null);
  },

  async getProfileMapData(getPublicCases: () => Promise<PublicMapCase[]>): Promise<ProfileMapResult> {
    // Never fail the whole map if the runner endpoint is slow/unauthorized —
    // fall through to the public community markers instead.
    let mine: PublicMapCase[] = [];
    let hasRunners = false;
    try {
      mine = await RunnerMapService.getUserRunnerMapCases();
      hasRunners = mine.length > 0;
      if (!hasRunners) {
        const probe = await ApiClient.get<{ runners?: ApiRunner[]; success?: boolean }>(
          '/api/v1/runner?page=1&pageSize=1'
        );
        hasRunners = (probe.runners?.length ?? 0) > 0;
      }
    } catch (error) {
      console.warn('[MAP] Runner map lookup failed; using public cases:', error);
    }

    if (mine.length > 0) {
      return {
        mode: 'mine',
        cases: mine,
        subtitle: `Your registered runner${mine.length > 1 ? 's' : ''}`,
      };
    }

    let publicCases: PublicMapCase[] = [];
    try {
      publicCases = await getPublicCases();
    } catch (error) {
      console.warn('[MAP] Public map fetch failed:', error);
      throw error;
    }

    return {
      mode: 'public',
      cases: publicCases,
      subtitle: hasRunners
        ? 'Community map — add coordinates to your runner to see them here'
        : 'Missing cases in the community',
    };
  },
};
