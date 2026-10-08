import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAccountData, useUpdateAccount } from "../../lib/hooks";
import { useLocale } from "../../lib/LocaleContext";
import { colors, fontSize, spacing } from "../../lib/theme";
import { Field, PrimaryButton, Section } from "../../components/UI";
import { LoadingSpinner } from "../../components/States";

const PAYOUT_METHODS = [
  { key: "bank", en: "Bank transfer", ar: "تحويل بنكي" },
  { key: "iban", en: "IBAN", ar: "IBAN" },
  { key: "wallet", en: "Mobile wallet", ar: "محفظة إلكترونية" },
  { key: "paymob", en: "Paymob", ar: "Paymob" },
];

export function PersonalDataScreen() {
  const { t, locale } = useLocale();
  const { data, isLoading } = useAccountData();
  const update = useUpdateAccount();

  const [legalName, setLegalName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [walletMsisdn, setWalletMsisdn] = useState("");
  const [holderName, setHolderName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setLegalName(data.legal_name ?? "");
      setNationalId(data.national_id ?? "");
      setDateOfBirth(data.date_of_birth ?? "");
      setPayoutMethod(data.payout_method ?? null);
      setBankName(data.payout_bank_name ?? "");
      setAccountNumber(data.payout_account_number ?? "");
      setWalletMsisdn(data.payout_wallet_msisdn ?? "");
      setHolderName(data.payout_holder_name ?? "");
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;

  const save = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({
        legal_name: legalName.trim() || null,
        national_id: nationalId.trim() || null,
        date_of_birth: dateOfBirth.trim() || null,
        // tax_id intentionally omitted: not part of the mobile profile
        // surface (founder requirement); the backend field is preserved
        // for web Settings → Taxes and admin financial reports.
        payout_method: payoutMethod,
        payout_bank_name: bankName.trim() || null,
        payout_account_number: accountNumber.trim() || null,
        payout_wallet_msisdn: walletMsisdn.trim() || null,
        payout_holder_name: holderName.trim() || null,
      });
      Alert.alert("", t("profileSaved"));
    } catch {
      Alert.alert("", t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Section title={t("personalInfo")}>
        <Field label={t("legalName")} value={legalName} onChangeText={setLegalName} />
        <Field
          label={t("nationalId")}
          value={nationalId}
          onChangeText={setNationalId}
          keyboardType="numeric"
        />
        <Field
          label={t("dateOfBirth")}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
        />
      </Section>

      <Section title={t("payoutPreferences")}>
        <Text style={styles.groupLabel}>{t("payoutMethod")}</Text>
        <View style={styles.chipRow}>
          {PAYOUT_METHODS.map((m) => {
            const active = payoutMethod === m.key;
            return (
              <Text
                key={m.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPayoutMethod(m.key)}
              >
                {locale === "ar" ? m.ar : m.en}
              </Text>
            );
          })}
        </View>
        {payoutMethod === "bank" || payoutMethod === "iban" || payoutMethod === "paymob" ? (
          <>
            <Field
              label={t("bankName")}
              value={bankName}
              onChangeText={setBankName}
            />
            <Field
              label={t("accountNumber")}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </>
        ) : null}
        {payoutMethod === "wallet" ? (
          <Field
            label={t("walletNumber")}
            value={walletMsisdn}
            onChangeText={setWalletMsisdn}
            keyboardType="phone-pad"
          />
        ) : null}
        <Field
          label={t("accountHolderName")}
          value={holderName}
          onChangeText={setHolderName}
        />
      </Section>

      <PrimaryButton
        label={saving ? t("loading") : t("save")}
        onPress={save}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  groupLabel: {
    fontSize: fontSize.sm,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text,
    overflow: "hidden",
  },
  chipActive: {
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    borderColor: colors.primary,
  },
});
