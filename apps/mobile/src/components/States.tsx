import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "../lib/theme";
import { useLocale } from "../lib/LocaleContext";

export function LoadingSpinner() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accentText} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useLocale();
  return (
    <View style={styles.container}>
      <Text style={styles.errorText}>{message || t("error")}</Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>{t("retry")}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyView({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      {icon ? <Text style={styles.emptyIcon}>{icon}</Text> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {actionLabel && onAction ? (
        <Pressable style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Skeleton({
  width,
  height,
  radius: r = radius.sm,
  style,
}: {
  width?: number | string;
  height: number;
  radius?: number;
  style?: object;
}) {
  return (
    <View
      style={[
        styles.skeleton,
        { height, borderRadius: r, ...(width !== undefined ? { width: width as number } : null) },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton height={180} radius={radius.lg} />
      <View style={styles.cardSkeletonBody}>
        <Skeleton height={16} width="70%" />
        <Skeleton height={14} width="45%" style={{ marginTop: spacing.sm }} />
        <Skeleton height={16} width="30%" style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  retryButtonText: {
    fontSize: fontSize.sm,
    color: colors.onPrimary,
    fontWeight: "700",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  actionButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    color: colors.onPrimary,
    fontWeight: "700",
  },
  skeleton: {
    backgroundColor: colors.surface,
  },
  cardSkeleton: {
    marginBottom: spacing.lg,
  },
  cardSkeletonBody: {
    paddingTop: spacing.md,
  },
});
