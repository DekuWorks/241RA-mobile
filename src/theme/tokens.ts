/**
 * 241 Runners Awareness design tokens — aligned with 241runnersawareness.org
 * Traffic light theme: red page, black header bar, white cards, red CTAs
 */

export const colors = {
  // Page & layout (site body + header)
  pageBg: '#ff0000',
  bg: '#ff0000',
  header: '#000000',

  // Surfaces (auth cards, case cards, forms)
  surface: '#ffffff',
  background: '#ffffff',

  // Text
  text: '#111827',
  textOnPage: '#ffffff',
  textOnHeader: '#ffffff',
  textMuted: '#6b7280',
  textSecondary: '#374151',

  // Brand / actions (Tailwind red scale — 600/700 match site CTAs)
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  primaryDark: '#b91c1c',
  secondary: '#6b7280',
  success: '#33cc33',
  warning: '#ffcc00',
  error: '#ff0000',
  danger: '#dc2626',
  white: '#ffffff',
  border: '#e5e7eb',

  // Traffic light system (matches styles.css)
  trafficLight: {
    red: '#ff0000',
    redMedium: '#dc2626',
    redDark: '#b91c1c',
    yellow: '#ffcc00',
    yellowMedium: '#f4c430',
    green: '#33cc33',
    greenMedium: '#28a745',
  },

  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
  },

  purple: {
    500: '#8b5cf6',
    600: '#7c3aed',
  },

  orange: {
    600: '#ea580c',
  },

  status: {
    missing: '#ffcc00',
    urgent: '#ff0000',
    resolved: '#33cc33',
    found: '#28a745',
  },

  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { sm: 6, md: 8, lg: 12, xl: 16 };

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  button: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const typography = {
  fontFamily: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};
