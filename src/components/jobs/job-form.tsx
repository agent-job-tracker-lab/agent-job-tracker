"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  cloneElement,
  FormEvent,
  isValidElement,
  type ReactElement,
  useState,
} from "react";

import {
  INITIAL_JOB_FORM_VALUES,
  parseJobForm,
  PREFECTURES,
  type JobFormValues,
} from "@/features/jobs/input";

type AgentCompanyOption = { id: string; companyName: string };
type ApiError = {
  message?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
};

export function JobForm({ companies }: { companies: AgentCompanyOption[] }) {
  const router = useRouter();
  const [values, setValues] = useState(INITIAL_JOB_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateValue<Field extends keyof JobFormValues>(
    field: Field,
    value: JobFormValues[Field],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setFormError("");
    setFieldErrors({});

    const parsed = parseJobForm(values);
    if (!parsed.success) {
      showFieldErrors(parsed.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (response.ok) {
        const job = (await response.json()) as { id: string };
        router.push(`/jobs/${job.id}`);
        router.refresh();
        return;
      }
      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const error = (await response.json()) as ApiError;
      if (error.fieldErrors?.length) {
        showFieldErrors(
          error.fieldErrors.map((item) => ({
            ...item,
            field:
              item.field === "monthlyRateMinYen"
                ? "monthlyRateMinManYen"
                : item.field === "monthlyRateMaxYen"
                  ? "monthlyRateMaxManYen"
                  : item.field,
          })),
        );
      } else {
        setFormError(
          error.message ??
            "登録に失敗しました。入力内容を保ったまま、もう一度お試しください。",
        );
      }
    } catch {
      setFormError(
        "通信できませんでした。接続を確認してもう一度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function showFieldErrors(errors: Array<{ field: string; message: string }>) {
    setFieldErrors(
      Object.fromEntries(errors.map((error) => [error.field, error.message])),
    );
    const firstField = errors[0]?.field;
    if (firstField) {
      window.setTimeout(() => document.getElementById(firstField)?.focus(), 0);
    }
  }

  return (
    <form className="company-form job-form" onSubmit={handleSubmit} noValidate>
      <fieldset disabled={isSubmitting}>
        <legend>案件情報</legend>
        {Object.keys(fieldErrors).length > 0 ? (
          <div className="form-error-summary" role="alert">
            <p>入力内容を確認してください。</p>
            <ul>
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>
                  <a href={`#${field}`}>{message}</a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="company-form-grid">
          <Field
            id="jobName"
            label="案件名"
            required
            error={fieldErrors.jobName}
          >
            <input
              id="jobName"
              value={values.jobName}
              onChange={(event) => updateValue("jobName", event.target.value)}
            />
          </Field>
          <Field
            id="agentCompanyId"
            label="紹介元エージェント会社"
            required
            error={fieldErrors.agentCompanyId}
          >
            <select
              id="agentCompanyId"
              value={values.agentCompanyId}
              onChange={(event) =>
                updateValue("agentCompanyId", event.target.value)
              }
            >
              <option value="">選択してください</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="companyName"
            label="企業名"
            error={fieldErrors.companyName}
          >
            <input
              id="companyName"
              value={values.companyName}
              onChange={(event) =>
                updateValue("companyName", event.target.value)
              }
            />
          </Field>
          <Field
            id="workStyle"
            label="勤務形態"
            required
            error={fieldErrors.workStyle}
          >
            <select
              id="workStyle"
              value={values.workStyle}
              onChange={(event) =>
                updateValue(
                  "workStyle",
                  event.target.value as JobFormValues["workStyle"],
                )
              }
            >
              <option value="">選択してください</option>
              <option value="FULL_REMOTE">フルリモート</option>
              <option value="HYBRID">ハイブリッド</option>
              <option value="ONSITE">常駐</option>
              <option value="UNKNOWN">未確認</option>
            </select>
          </Field>
          <Field
            id="commercialFlow"
            label="商流"
            error={fieldErrors.commercialFlow}
            wide
          >
            <textarea
              id="commercialFlow"
              rows={3}
              value={values.commercialFlow}
              onChange={(event) =>
                updateValue("commercialFlow", event.target.value)
              }
            />
          </Field>
          <Field
            id="monthlyRateMinManYen"
            label="単価下限（万円）"
            error={fieldErrors.monthlyRateMinManYen}
          >
            <input
              id="monthlyRateMinManYen"
              inputMode="decimal"
              value={values.monthlyRateMinManYen}
              onChange={(event) =>
                updateValue("monthlyRateMinManYen", event.target.value)
              }
            />
          </Field>
          <Field
            id="monthlyRateMaxManYen"
            label="単価上限（万円）"
            error={fieldErrors.monthlyRateMaxManYen}
          >
            <input
              id="monthlyRateMaxManYen"
              inputMode="decimal"
              value={values.monthlyRateMaxManYen}
              onChange={(event) =>
                updateValue("monthlyRateMaxManYen", event.target.value)
              }
            />
          </Field>
          <Field
            id="workStyleNotes"
            label="勤務形態の補足"
            error={fieldErrors.workStyleNotes}
            wide
          >
            <textarea
              id="workStyleNotes"
              rows={3}
              value={values.workStyleNotes}
              onChange={(event) =>
                updateValue("workStyleNotes", event.target.value)
              }
            />
          </Field>
          <Field
            id="prefecture"
            label="都道府県"
            error={fieldErrors.prefecture}
          >
            <select
              id="prefecture"
              value={values.prefecture}
              onChange={(event) =>
                updateValue(
                  "prefecture",
                  event.target.value as JobFormValues["prefecture"],
                )
              }
            >
              <option value="">未設定</option>
              {PREFECTURES.map((prefecture) => (
                <option key={prefecture} value={prefecture}>
                  {prefecture}
                </option>
              ))}
            </select>
          </Field>
          <Field id="city" label="市区町村" error={fieldErrors.city}>
            <input
              id="city"
              value={values.city}
              onChange={(event) => updateValue("city", event.target.value)}
            />
          </Field>
          <Field
            id="nearestStation"
            label="最寄り駅"
            error={fieldErrors.nearestStation}
          >
            <input
              id="nearestStation"
              value={values.nearestStation}
              onChange={(event) =>
                updateValue("nearestStation", event.target.value)
              }
            />
          </Field>
          <Field
            id="utilizationPercent"
            label="稼働率（%）"
            error={fieldErrors.utilizationPercent}
          >
            <input
              id="utilizationPercent"
              inputMode="decimal"
              value={values.utilizationPercent}
              onChange={(event) =>
                updateValue("utilizationPercent", event.target.value)
              }
            />
          </Field>
          <Field
            id="locationNotes"
            label="勤務地補足"
            error={fieldErrors.locationNotes}
            wide
          >
            <textarea
              id="locationNotes"
              rows={3}
              value={values.locationNotes}
              onChange={(event) =>
                updateValue("locationNotes", event.target.value)
              }
            />
          </Field>
          <Field
            id="technologies"
            label="技術（1行に1件）"
            error={fieldErrors.technologies}
          >
            <textarea
              id="technologies"
              rows={5}
              value={values.technologies}
              onChange={(event) =>
                updateValue("technologies", event.target.value)
              }
            />
          </Field>
          <Field
            id="processPhases"
            label="担当工程（1行に1件）"
            error={fieldErrors.processPhases}
          >
            <textarea
              id="processPhases"
              rows={5}
              value={values.processPhases}
              onChange={(event) =>
                updateValue("processPhases", event.target.value)
              }
            />
          </Field>
          <Field
            id="requiredConditions"
            label="必須条件"
            error={fieldErrors.requiredConditions}
            wide
          >
            <textarea
              id="requiredConditions"
              rows={5}
              value={values.requiredConditions}
              onChange={(event) =>
                updateValue("requiredConditions", event.target.value)
              }
            />
          </Field>
          <Field
            id="preferredConditions"
            label="歓迎条件"
            error={fieldErrors.preferredConditions}
            wide
          >
            <textarea
              id="preferredConditions"
              rows={5}
              value={values.preferredConditions}
              onChange={(event) =>
                updateValue("preferredConditions", event.target.value)
              }
            />
          </Field>
        </div>

        <p className="required-note">
          「必須」の項目は入力が必要です。勤務形態は明示的に選択してください。
        </p>
        {formError ? (
          <p className="company-form-error" role="alert" aria-live="polite">
            {formError}
          </p>
        ) : null}
        <div className="company-form-actions">
          <Link className="secondary-button" href="/jobs">
            キャンセル
          </Link>
          <button className="primary-button" type="submit">
            {isSubmitting ? "登録中…" : "登録する"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function Field({
  id,
  label,
  required = false,
  error,
  wide = false,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          "aria-describedby"?: string;
          "aria-invalid"?: boolean;
        }>,
        {
          "aria-describedby": error ? `${id}-error` : undefined,
          "aria-invalid": Boolean(error),
        },
      )
    : children;
  return (
    <div
      className={
        wide
          ? "company-form-field company-form-field-wide"
          : "company-form-field"
      }
    >
      <label htmlFor={id}>
        {label}
        {required ? <span className="required-label">必須</span> : null}
      </label>
      {control}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
