import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  useMaintenanceRequests,
  useMaintenanceUpdate,
  useOpsDashboard,
  useOpsTask,
  usePropertyReadiness,
  useReadinessUpdate,
  useTaskAction,
} from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import {
  Empty,
  Field,
  ListRow,
  PrimaryButton,
  Row,
  Section,
  StatusBadge,
} from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { MaintenanceRequest } from "../../lib/types";

const TONE: Record<string, "ok" | "warn" | "err" | "info"> = {
  OPEN: "warn",
  IN_PROGRESS: "info",
  RESOLVED: "ok",
  CANCELLED: "err",
};

export function OpsTasksScreen() {
  const { t, locale } = useLocale();
  const { data: dashboard } = useOpsDashboard();
  const { data, isLoading, error, refetch } = useMaintenanceRequests();
  const maintenance = useMaintenanceUpdate();
  const taskAction = useTaskAction();
  const readinessUpdate = useReadinessUpdate();

  const [selected, setSelected] = useState<MaintenanceRequest | null>(null);
  const [note, setNote] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const task = useOpsTask(selected?.related_task_id ?? null);
  const readiness = usePropertyReadiness(selected?.unit_id ?? null);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const setReqStatus = async (status: string) => {
    if (!selected) return;
    try {
      await maintenance.mutateAsync({
        requestId: selected.id,
        payload: { status },
      });
      setSelected(null);
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const runTask = async (act: "start" | "complete" | "notes") => {
    const taskId = selected?.related_task_id;
    if (!taskId) return;
    try {
      await taskAction.mutateAsync({
        taskId,
        action: act,
        payload: act === "notes" ? { note: note.trim() } : {},
      });
      if (act !== "notes") setNote("");
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  const setReady = async (status: "READY" | "NOT_READY") => {
    if (!selected) return;
    try {
      await readinessUpdate.mutateAsync({
        unitId: selected.unit_id,
        payload: {
          status,
          reason: status === "NOT_READY" ? blockReason.trim() || undefined : undefined,
        },
      });
    } catch (err: any) {
      Alert.alert("", err?.response?.data?.error?.message || t("error"));
    }
  };

  if (selected) {
    const related = task.data;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Section title={selected.issue_type}>
          <Row label={t("status")} value={selected.status} />
          <Row label={t("property")} value={selected.unit_id.slice(0, 8)} />
          <Row label={t("details")} value={selected.description} />
          <Row
            label={t("created")}
            value={new Date(selected.created_at).toLocaleString(dateLocale)}
          />
        </Section>

        <Section>
          {selected.status === "OPEN" && (
            <PrimaryButton
              label={t("markInProgress")}
              onPress={() => setReqStatus("IN_PROGRESS")}
              disabled={maintenance.isPending}
            />
          )}
          {(selected.status === "OPEN" || selected.status === "IN_PROGRESS") && (
            <PrimaryButton
              label={t("markResolved")}
              onPress={() => setReqStatus("RESOLVED")}
              disabled={maintenance.isPending}
            />
          )}
          {selected.status !== "CANCELLED" && selected.status !== "RESOLVED" && (
            <PrimaryButton
              danger
              label={t("cancel")}
              onPress={() => setReqStatus("CANCELLED")}
              disabled={maintenance.isPending}
            />
          )}
        </Section>

        {related && (
          <Section title={`${t("relatedTask")} · ${related.task_type}`}>
            <Row label={t("status")} value={related.status} />
            <Row label={t("priority")} value={related.priority} />
            <Row
              label={t("dueBy")}
              value={new Date(related.due_by).toLocaleString(dateLocale)}
            />
            {related.status !== "COMPLETED" && related.status !== "CANCELLED" && (
              <>
                {related.status !== "IN_PROGRESS" && (
                  <PrimaryButton
                    secondary
                    label={t("startTask")}
                    onPress={() => runTask("start")}
                    disabled={taskAction.isPending}
                  />
                )}
                <PrimaryButton
                  secondary
                  label={t("completeTask")}
                  onPress={() => runTask("complete")}
                  disabled={taskAction.isPending}
                />
              </>
            )}
            <Field label={t("addNote")} value={note} onChangeText={setNote} />
            <PrimaryButton
              secondary
              label={t("saveNote")}
              onPress={() => runTask("notes")}
              disabled={taskAction.isPending || !note.trim()}
            />
          </Section>
        )}

        {readiness.data && (
          <Section title={t("readiness")}>
            <Row label={t("status")} value={readiness.data.status} />
            <Row label={t("reason")} value={readiness.data.reason} />
            {readiness.data.status !== "READY" ? (
              <PrimaryButton
                secondary
                label={t("markReady")}
                onPress={() => setReady("READY")}
                disabled={readinessUpdate.isPending}
              />
            ) : (
              <>
                <Field
                  label={t("reason")}
                  value={blockReason}
                  onChangeText={setBlockReason}
                />
                <PrimaryButton
                  secondary
                  label={t("markNotReady")}
                  onPress={() => setReady("NOT_READY")}
                  disabled={readinessUpdate.isPending}
                />
              </>
            )}
          </Section>
        )}

        <PrimaryButton secondary label={t("back")} onPress={() => setSelected(null)} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {dashboard && (
        <View style={styles.dashRow}>
          <Text style={styles.dashText}>
            {t("statPendingTasks")}: {dashboard.pending_tasks} · {t("statOverdue")}:{" "}
            {dashboard.overdue_tasks} · {t("statMaintenance")}:{" "}
            {dashboard.open_maintenance_requests} · {t("statNotReady")}:{" "}
            {dashboard.not_ready_units}
          </Text>
        </View>
      )}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorView message={t("error")} onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Section title={t("maintenance")}>
            {(data ?? []).length === 0 ? (
              <Empty text={t("queueEmpty")} />
            ) : (
              (data ?? []).map((r: MaintenanceRequest) => (
                <ListRow
                  key={r.id}
                  title={r.issue_type}
                  subtitle={`${r.description ?? ""} · ${new Date(r.created_at).toLocaleDateString(dateLocale)}`}
                  right={<StatusBadge label={r.status} tone={TONE[r.status] ?? "info"} />}
                  onPress={() => setSelected(r)}
                />
              ))
            )}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dashRow: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 8,
  },
  dashText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: "center" },
  content: { padding: spacing.lg },
});
