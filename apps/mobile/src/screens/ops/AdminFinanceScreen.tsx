import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useFinanceEscrow, useFinanceLedger, useFinancePayouts } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, spacing } from "../../lib/theme";
import { Empty, FilterChips, ListRow, Section, StatusBadge } from "../../components/UI";
import { LoadingSpinner, ErrorView } from "../../components/States";
import type { EscrowRecord, LedgerRecord, PayoutRecord } from "../../lib/types";
import { formatMoney } from "../../lib/money";

const TABS = [
  { key: "escrow", en: "Escrow", ar: "الضمان" },
  { key: "payouts", en: "Payouts", ar: "المدفوعات للمضيفين" },
  { key: "ledger", en: "Ledger", ar: "دفتر الأستاذ" },
];

const LEDGER_ACCOUNTS = [
  { key: "platform_revenue", en: "Platform revenue", ar: "إيراد المنصة" },
  { key: "vat_payable", en: "VAT payable", ar: "ض.ق.م مستحقة" },
  { key: "host_payable", en: "Host payable", ar: "مستحق للمضيفين" },
];

export function AdminFinanceScreen() {
  const { t, locale } = useLocale();
  const [tab, setTab] = useState<string>("escrow");
  const [ledgerAccount, setLedgerAccount] = useState<string>("platform_revenue");
  const escrow = useFinanceEscrow();
  const payouts = useFinancePayouts();
  const ledger = useFinanceLedger(ledgerAccount);
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const active = tab === "escrow" ? escrow : tab === "payouts" ? payouts : ledger;

  return (
    <View style={styles.container}>
      <View style={styles.filters}>
        <FilterChips
          options={TABS.map((x) => ({ key: x.key, label: locale === "ar" ? x.ar : x.en }))}
          value={tab}
          onChange={(k) => setTab(k ?? "escrow")}
        />
        {tab === "ledger" && (
          <FilterChips
            options={LEDGER_ACCOUNTS.map((x) => ({
              key: x.key,
              label: locale === "ar" ? x.ar : x.en,
            }))}
            value={ledgerAccount}
            onChange={(k) => setLedgerAccount(k ?? "platform_revenue")}
          />
        )}
      </View>
      {active.isLoading ? (
        <LoadingSpinner />
      ) : active.error ? (
        <ErrorView message={t("error")} onRetry={active.refetch} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Section>
            {tab === "escrow" &&
              ((escrow.data ?? []).length === 0 ? (
                <Empty text={t("noRecords")} />
              ) : (
                (escrow.data ?? []).map((e: EscrowRecord) => (
                  <ListRow
                    key={e.id}
                    title={formatMoney(e.amount_egp, t("egp"))}
                    subtitle={`${e.unit_title ?? e.reservation_id.slice(0, 8)} · ${new Date(
                      e.created_at
                    ).toLocaleDateString(dateLocale)}`}
                    right={
                      <StatusBadge
                        label={e.status}
                        tone={e.status === "released" ? "ok" : "warn"}
                      />
                    }
                  />
                ))
              ))}
            {tab === "payouts" &&
              ((payouts.data ?? []).length === 0 ? (
                <Empty text={t("noRecords")} />
              ) : (
                (payouts.data ?? []).map((p: PayoutRecord) => (
                  <ListRow
                    key={p.id}
                    title={formatMoney(p.amount_egp, t("egp"))}
                    subtitle={`${t("host")}: ${p.host_id.slice(0, 8)} · ${new Date(
                      p.created_at
                    ).toLocaleDateString(dateLocale)}`}
                    right={
                      <StatusBadge
                        label={p.status}
                        tone={p.status === "paid" ? "ok" : "warn"}
                      />
                    }
                  />
                ))
              ))}
            {tab === "ledger" &&
              ((ledger.data ?? []).length === 0 ? (
                <Empty text={t("noRecords")} />
              ) : (
                (ledger.data ?? []).slice(0, 100).map((l: LedgerRecord) => (
                  <ListRow
                    key={l.id}
                    title={`${l.entry_type} · ${formatMoney(l.amount_egp, t("egp"))}`}
                    subtitle={`${l.description ?? l.ledger_account} · ${new Date(
                      l.created_at
                    ).toLocaleDateString(dateLocale)}`}
                  />
                ))
              ))}
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { padding: spacing.md, paddingBottom: 0 },
  content: { padding: spacing.lg },
});
