import { StyleSheet } from 'react-native';
import { colors, radii, shadows, spacing, typography } from './tokens';

/** Shared styles matching 241runnersawareness.org */
export const siteStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.header,
    minHeight: 56,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textOnHeader,
  },
  headerLink: {
    fontSize: typography.sizes.sm,
    color: colors.textOnHeader,
    fontWeight: typography.weights.medium,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  cardBody: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.text,
  },
  inputFocused: {
    borderColor: colors.primary[600],
  },
  buttonPrimary: {
    backgroundColor: colors.primary[600],
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.button,
  },
  buttonPrimaryText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[400],
  },
  link: {
    fontSize: typography.sizes.sm,
    color: colors.primary[600],
    fontWeight: typography.weights.medium,
  },
  pageTitle: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.textOnPage,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.textOnPage,
    opacity: 0.95,
    textAlign: 'center',
  },
});
