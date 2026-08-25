"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  agentCompanyFormSchema,
  toAgentCompanyFieldErrors,
  type AgentCompanyStatusInput,
} from "@/features/agent-companies/input";

export type AgentCompanyFormValues = {
  companyName: string;
  contactName: string;
  contactDetails: string;
  characteristics: string;
  lastContactDate: string;
  status: AgentCompanyStatusInput;
};

type ApiError = {
  code?: string;
  message?: string;
  fieldErrors?: Array<{ field: string; code: string; message: string }>;
};

type SavedCompany = { id: string };

const INITIAL_VALUES: AgentCompanyFormValues = {
  companyName: "",
  contactName: "",
  contactDetails: "",
  characteristics: "",
  lastContactDate: "",
  status: "ACTIVE",
};

export function AgentCompanyForm({
  mode = "create",
  companyId,
  initialValues,
}: {
  mode?: "create" | "edit";
  companyId?: string;
  initialValues?: AgentCompanyFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues ?? INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = mode === "edit";
  const detailHref = companyId ? `/agent-companies/${companyId}` : null;

  function updateValue<Field extends keyof AgentCompanyFormValues>(
    field: Field,
    value: AgentCompanyFormValues[Field],
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

    const parsed = agentCompanyFormSchema.safeParse(values);
    if (!parsed.success) {
      const errors = toAgentCompanyFieldErrors(parsed.error);
      showFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        isEdit && companyId
          ? `/api/agent-companies/${companyId}`
          : "/api/agent-companies",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );

      if (response.ok) {
        const company = (await response.json()) as SavedCompany;
        router.push(`/agent-companies/${company.id}`);
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
        showFieldErrors(error.fieldErrors);
      } else {
        setFormError(
          error.message ??
            `${isEdit ? "更新" : "登録"}に失敗しました。入力内容を保ったまま、もう一度お試しください。`,
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
    const nextErrors = Object.fromEntries(
      errors.map((error) => [error.field, error.message]),
    );
    setFieldErrors(nextErrors);

    const firstField = errors[0]?.field;
    if (firstField) {
      window.setTimeout(() => document.getElementById(firstField)?.focus(), 0);
    }
  }

  return (
    <form className="company-form" onSubmit={handleSubmit} noValidate>
      <fieldset disabled={isSubmitting}>
        <legend>エージェント会社情報</legend>
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
          <FormField
            id="companyName"
            label="会社名"
            required
            error={fieldErrors.companyName}
          >
            <input
              id="companyName"
              name="companyName"
              value={values.companyName}
              onChange={(event) =>
                updateValue("companyName", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.companyName)}
              aria-describedby={errorId("companyName", fieldErrors.companyName)}
              autoComplete="organization"
            />
          </FormField>

          <FormField
            id="contactName"
            label="担当者名"
            error={fieldErrors.contactName}
          >
            <input
              id="contactName"
              name="contactName"
              value={values.contactName}
              onChange={(event) =>
                updateValue("contactName", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.contactName)}
              aria-describedby={errorId("contactName", fieldErrors.contactName)}
              autoComplete="name"
            />
          </FormField>

          <FormField
            id="contactDetails"
            label="連絡先"
            error={fieldErrors.contactDetails}
          >
            <textarea
              id="contactDetails"
              name="contactDetails"
              value={values.contactDetails}
              onChange={(event) =>
                updateValue("contactDetails", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.contactDetails)}
              aria-describedby={errorId(
                "contactDetails",
                fieldErrors.contactDetails,
              )}
              rows={4}
            />
          </FormField>

          <FormField
            id="status"
            label="関係状態"
            required
            error={fieldErrors.status}
          >
            <select
              id="status"
              name="status"
              value={values.status}
              onChange={(event) =>
                updateValue(
                  "status",
                  event.target.value as AgentCompanyStatusInput,
                )
              }
              aria-invalid={Boolean(fieldErrors.status)}
              aria-describedby={errorId("status", fieldErrors.status)}
            >
              <option value="ACTIVE">積極対応中</option>
              <option value="ON_HOLD">保留</option>
              <option value="ENDED">終了</option>
            </select>
          </FormField>

          <FormField
            id="lastContactDate"
            label="最終連絡日"
            error={fieldErrors.lastContactDate}
          >
            <input
              id="lastContactDate"
              name="lastContactDate"
              type="date"
              value={values.lastContactDate}
              onChange={(event) =>
                updateValue("lastContactDate", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.lastContactDate)}
              aria-describedby={errorId(
                "lastContactDate",
                fieldErrors.lastContactDate,
              )}
            />
          </FormField>

          <FormField
            id="characteristics"
            label="特徴"
            error={fieldErrors.characteristics}
            wide
          >
            <textarea
              id="characteristics"
              name="characteristics"
              value={values.characteristics}
              onChange={(event) =>
                updateValue("characteristics", event.target.value)
              }
              aria-invalid={Boolean(fieldErrors.characteristics)}
              aria-describedby={errorId(
                "characteristics",
                fieldErrors.characteristics,
              )}
              rows={5}
            />
          </FormField>
        </div>

        <p className="required-note">「必須」の項目は入力が必要です。</p>

        {formError ? (
          <p className="company-form-error" role="alert" aria-live="polite">
            {formError}
          </p>
        ) : null}

        <div className="company-form-actions">
          <Link
            className="secondary-button"
            href={isEdit && detailHref ? detailHref : "/agent-companies"}
          >
            キャンセル
          </Link>
          <button className="primary-button" type="submit">
            {isSubmitting
              ? isEdit
                ? "更新中…"
                : "登録中…"
              : isEdit
                ? "変更を保存"
                : "登録する"}
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function FormField({
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
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function errorId(field: string, error?: string) {
  return error ? `${field}-error` : undefined;
}
