export const colors = {
  bg: '#0b0b0b',
  background: '#0b0b0b',
  text: '#f5f5f5',
  primary: '#8C9900', // Traffic light green
  secondary: '#64748b',
  success: '#8C9900', // Traffic light green
  warning: '#F4A62A', // Traffic light yellow
  error: '#DA2121', // Traffic light red
  white: '#ffffff',
  surface: '#1f2937',
  // Traffic light theme colors
  trafficLight: {
    red: '#DA2121',
    yellow: '#F4A62A',
    green: '#8C9900',
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
    missing: '#FFCC00',
    urgent: '#FF3B30',
    resolved: '#34C759',
    found: '#2ECC71',
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
export const radii = { sm: 6, md: 10, lg: 16, xl: 20 };

export const typography = {
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
  // Typography styles for components
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
