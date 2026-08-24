"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) {
        setError("ログアウトに失敗しました。もう一度お試しください。");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setError("通信に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="logout-control">
      <button
        className="text-button"
        type="button"
        onClick={handleLogout}
        disabled={isSubmitting}
      >
        {isSubmitting ? "ログアウト中…" : "ログアウト"}
      </button>
      <p className="header-error" role="alert" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
