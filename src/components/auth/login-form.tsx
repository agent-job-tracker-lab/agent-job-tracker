"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

type ErrorResponse = {
  code?: string;
  message?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
};

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function focusAfterSubmit(element: HTMLInputElement | null) {
    window.setTimeout(() => element?.focus(), 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setFieldErrors({});
    setFormError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        router.replace("/jobs");
        router.refresh();
        return;
      }

      const error = (await response.json()) as ErrorResponse;
      const nextFieldErrors: FieldErrors = {};
      for (const item of error.fieldErrors ?? []) {
        if (item.field === "email" || item.field === "password") {
          nextFieldErrors[item.field] ??= item.message;
        }
      }

      setFieldErrors(nextFieldErrors);
      setFormError(
        error.message ??
          "処理に失敗しました。時間をおいてもう一度お試しください。",
      );
      setPassword("");

      if (nextFieldErrors.email) {
        focusAfterSubmit(emailRef.current);
      } else {
        focusAfterSubmit(passwordRef.current);
      }
    } catch {
      setFormError(
        "通信に失敗しました。接続を確認してもう一度お試しください。",
      );
      setPassword("");
      focusAfterSubmit(passwordRef.current);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="email">メールアドレス</label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          value={email}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.email ? (
          <p id="email-error" className="field-error">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="form-field">
        <label htmlFor="password">パスワード</label>
        <input
          ref={passwordRef}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isSubmitting}
        />
        {fieldErrors.password ? (
          <p id="password-error" className="field-error">
            {fieldErrors.password}
          </p>
        ) : null}
      </div>

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "ログイン中…" : "ログイン"}
      </button>

      <p className="form-error" role="alert" aria-live="polite">
        {formError}
      </p>
    </form>
  );
}
