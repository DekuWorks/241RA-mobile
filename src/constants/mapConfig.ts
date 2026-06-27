/** Shared map settings — aligned with website google-maps-config.js */
export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lat: 29.7604,
    lng: -95.3698,
  },
  DEFAULT_ZOOM: 10,
  CLUSTER_MAX_ZOOM: 14,
  CLUSTER_RADIUS: 50,
  STATUS_COLORS: {
    missing: '#f59e0b',
    found: '#dc2626',
    safe: '#10b981',
    urgent: '#ef4444',
    resolved: '#33cc33',
    deceased: '#6b7280',
    resolved_pending_verify: '#8b5cf6',
  } as Record<string, string>,
};

export function getMapStatusColor(status: string): string {
  return MAP_CONFIG.STATUS_COLORS[status.toLowerCase()] ?? '#6b7280';
}
