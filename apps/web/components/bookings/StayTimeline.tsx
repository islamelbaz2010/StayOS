"use client";

import { useTranslations } from "next-intl";

interface StayTimelineProps {
  phase: string;
  paymentStatus: string | null;
  bookingStatus: string;
}

const STEPS = [
  { key: "booked", phases: ["upcoming", "check_in_ready", "checked_in", "checkout_ready", "checked_out", "completed"] },
  { key: "confirmed", phases: ["upcoming", "check_in_ready", "checked_in", "checkout_ready", "checked_out", "completed"] },
  { key: "checkedIn", phases: ["checked_in", "checkout_ready", "checked_out", "completed"] },
  { key: "completed", phases: ["completed"] },
];

export function StayTimeline({ phase, paymentStatus, bookingStatus }: StayTimelineProps) {
  const t = useTranslations("trips");

  const isTerminal = phase === "cancelled" || phase === "rejected" || phase === "no_show";

  if (isTerminal) {
    return (
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-100">
            <svg className="h-5 w-5 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-danger-700">
            {t(`phase.${phase}`)}
          </p>
        </div>
      </div>
    );
  }

  const getStepState = (index: number): "done" | "current" | "pending" => {
    const step = STEPS[index];

    if (step.key === "confirmed") {
      const isConfirmed = paymentStatus === "verified" || bookingStatus === "confirmed";
      const isPast = STEPS[index + 1]?.phases.includes(phase);
      if (isPast) return "done";
      if (isConfirmed) return "current";
      return "pending";
    }

    const isCurrentStep = step.phases.includes(phase) &&
      !STEPS[index + 1]?.phases.includes(phase);
    const isPastStep = STEPS[index + 1]?.phases.includes(phase);

    if (isPastStep) return "done";
    if (isCurrentStep) return "current";

    if (index === 0 && step.phases.includes(phase)) return "current";
    return "pending";
  };

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-neutral-500">
        {t("timelineTitle")}
      </h3>
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const state = getStepState(index);
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition
                    ${state === "done" ? "bg-success-500 text-white" : ""}
                    ${state === "current" ? "bg-brand-600 text-white ring-4 ring-brand-100" : ""}
                    ${state === "pending" ? "bg-neutral-200 text-neutral-500" : ""}
                  `}
                >
                  {state === "done" ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`
                    text-center text-xs font-medium
                    ${state === "current" ? "text-brand-700" : ""}
                    ${state === "done" ? "text-success-700" : ""}
                    ${state === "pending" ? "text-neutral-400" : ""}
                  `}
                >
                  {t(`timeline.${step.key}`)}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`
                    mx-2 h-0.5 flex-1 transition
                    ${getStepState(index + 1) !== "pending" ? "bg-success-500" : "bg-neutral-200"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
