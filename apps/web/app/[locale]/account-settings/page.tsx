"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import { useAccount } from "@/lib/queries/account";

const copy = {
  en: {
    title: "Account settings",
    subtitle: "Identity, security, privacy, payments, language, and hosting settings.",
    personal: "Personal information",
    personalBody: "Legal name, email, phone, identity verification, date of birth, and residential address.",
    security: "Login & security",
    securityBody: "Password and recovery are available. Passkeys and device history are not currently supported.",
    privacy: "Privacy",
    privacyBody: "Download your StayOS account data or permanently deactivate and anonymize your account. Blocking and visibility controls are not currently supported.",
    notifications: "Notifications",
    notificationsBody: "Account activity, booking requests, messages, and operational updates. Configurable marketing preferences are not currently supported.",
    taxes: "Taxes",
    taxesBody: "Tax ID can be recorded on your account. VAT documents and automated taxpayer workflows are not currently supported.",
    payments: "Payments",
    paymentsBody: "View payment history. StayOS does not store card details; card checkout is hosted by the payment provider.",
    payouts: "Payouts",
    payoutsBody: "Manage your declared payout destination and view host earnings. Provider payout execution is not yet provisioned.",
    language: "Languages & currency",
    languageBody: "StayOS supports Arabic and English. EGP is the fixed marketplace currency; timezone follows your device.",
    hosting: "Professional hosting",
    hostingBody: "Open your host dashboard, listings, calendar, earnings, promotions, and operational tools.",
    open: "Open",
    configured: "Configured",
    notConfigured: "Not configured",
    pending: "Pending product/legal decision",
    export: "Download my data",
    exporting: "Preparing…",
    delete: "Deactivate account",
    deleteConfirm: "This permanently anonymizes your account and signs you out. Continue?",
    legalName: "Legal name",
    address: "Residential address",
    taxId: "Tax ID",
    verified: "Identity verification",
  },
  ar: {
    title: "إعدادات الحساب",
    subtitle: "الهوية والأمان والخصوصية والمدفوعات واللغة وإعدادات الاستضافة.",
    personal: "المعلومات الشخصية",
    personalBody: "الاسم القانوني والبريد والهاتف والتحقق من الهوية وتاريخ الميلاد وعنوان السكن.",
    security: "تسجيل الدخول والأمان",
    securityBody: "كلمة المرور والاسترداد متاحان. مفاتيح المرور وسجل الأجهزة غير مدعومين حاليًا.",
    privacy: "الخصوصية",
    privacyBody: "نزّل بيانات حسابك أو عطّل حسابك وأخفِ هويتك نهائيًا. الحظر وإعدادات الظهور غير مدعومة حاليًا.",
    notifications: "الإشعارات",
    notificationsBody: "نشاط الحساب وطلبات الحجز والرسائل والتحديثات التشغيلية. تفضيلات التسويق القابلة للتخصيص غير مدعومة حاليًا.",
    taxes: "الضرائب",
    taxesBody: "يمكن تسجيل الرقم الضريبي بالحساب. مستندات ضريبة القيمة المضافة وإجراءات دافع الضرائب الآلية غير مدعومة حاليًا.",
    payments: "المدفوعات",
    paymentsBody: "اعرض سجل المدفوعات. لا يحتفظ StayOS ببيانات البطاقة؛ الدفع بالبطاقة مستضاف لدى مزود الدفع.",
    payouts: "الدفعات للمضيف",
    payoutsBody: "أدر وجهة الدفع المعلنة واعرض أرباح المضيف. تنفيذ الدفعات عبر المزود غير مفعّل بعد.",
    language: "اللغات والعملة",
    languageBody: "يدعم StayOS العربية والإنجليزية. الجنيه المصري هو عملة السوق الثابتة؛ والمنطقة الزمنية حسب جهازك.",
    hosting: "أدوات الاستضافة الاحترافية",
    hostingBody: "افتح لوحة المضيف والإعلانات والتقويم والأرباح والعروض والأدوات التشغيلية.",
    open: "فتح",
    configured: "مُعد",
    notConfigured: "غير مُعد",
    pending: "بانتظار قرار منتج/قانوني",
    export: "تنزيل بياناتي",
    exporting: "جارٍ التحضير…",
    delete: "تعطيل الحساب",
    deleteConfirm: "سيؤدي ذلك إلى إخفاء هوية حسابك نهائيًا وتسجيل خروجك. هل تريد المتابعة؟",
    legalName: "الاسم القانوني",
    address: "عنوان السكن",
    taxId: "الرقم الضريبي",
    verified: "التحقق من الهوية",
  },
} as const;

function Card({ title, body, href, action, children, id }: { title: string; body: string; href?: string; action: string; children?: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-xl bg-white p-5 shadow-card">
      <h2 className="font-semibold text-brand-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-600">{body}</p>
      {children}
      {href && <Link href={href} className="mt-4 inline-block text-sm font-semibold text-accent-600 hover:text-accent-700">{action}</Link>}
    </section>
  );
}

export default function AccountSettingsPage() {
  const { locale = "ar" } = useParams<{ locale: string }>();
  const text = copy[locale === "ar" ? "ar" : "en"];
  const { user, logout } = useAuth();
  const { data: account } = useAccount();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    try {
      const { data } = await api.get("/auth/me/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "stayos-account-data.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const deactivate = async () => {
    if (!window.confirm(text.deleteConfirm)) return;
    await api.delete("/auth/me");
    await logout();
    router.push(`/${locale}`);
  };

  const address = account?.address && Object.values(account.address).filter(Boolean).join(", ");

  return (
    <ProtectedRoute>
      <GuestLayout>
        <main className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold text-brand-900">{text.title}</h1>
          <p className="mt-2 text-neutral-600">{text.subtitle}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card title={text.personal} body={text.personalBody} href={`/${locale}/profile`} action={text.open}>
              <dl className="mt-3 space-y-1 text-xs text-neutral-500">
                <div className="flex justify-between"><dt>{text.legalName}</dt><dd>{account?.legal_name || text.notConfigured}</dd></div>
                <div className="flex justify-between"><dt>{text.address}</dt><dd className="max-w-[60%] text-end">{address || text.notConfigured}</dd></div>
                <div className="flex justify-between"><dt>{text.verified}</dt><dd>{user?.kyc_status || text.notConfigured}</dd></div>
              </dl>
            </Card>
            <Card title={text.security} body={text.securityBody} href={`/${locale}/profile`} action={text.open} />
            <Card title={text.privacy} body={text.privacyBody} action={text.open}>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={exportData} disabled={exporting} className="btn-secondary text-sm disabled:opacity-50">{exporting ? text.exporting : text.export}</button>
                <button type="button" onClick={deactivate} className="rounded-md px-4 py-2 text-sm font-semibold text-danger-600 hover:bg-danger-50">{text.delete}</button>
              </div>
            </Card>
            <Card title={text.notifications} body={text.notificationsBody} href={`/${locale}/notifications`} action={text.open} />
            <Card title={text.taxes} body={text.taxesBody} action={text.open}>
              <p className="mt-3 text-xs text-neutral-500">{text.taxId}: {account?.tax_id || text.notConfigured}</p>
            </Card>
            <Card title={text.payments} body={text.paymentsBody} href={`/${locale}/payments`} action={text.open} />
            {user?.role === "host" && <Card title={text.payouts} body={text.payoutsBody} href={`/${locale}/host/profile`} action={text.open} />}
            <Card id="language" title={text.language} body={text.languageBody} action={text.configured}>
              <p className="mt-3 text-xs text-neutral-500">{user?.locale === "en" ? "English" : "العربية"} · EGP</p>
            </Card>
            {user?.role === "host" && <Card title={text.hosting} body={text.hostingBody} href={`/${locale}/host`} action={text.open} />}
          </div>
        </main>
      </GuestLayout>
    </ProtectedRoute>
  );
}
