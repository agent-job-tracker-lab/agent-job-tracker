"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useId, useState } from "react";

import {
  APPLICATION_STATUSES,
  type ApplicationStatusInput,
} from "@/features/applications/input";
import { APPLICATION_STATUS_LABELS } from "@/features/jobs/presentation";

type ApiError = { code?: string; message?: string };
type UpdatedApplication = { status: ApplicationStatusInput };

export function ApplicationStatusControl({
  jobId,
  jobName,
  currentStatus,
  compact = false,
}: {
  jobId: string;
  jobName: string;
  currentStatus: ApplicationStatusInput;
  compact?: boolean;
}) {
  const router = useRouter();
  const controlId = useId();
  const [lastServerStatus, setLastServerStatus] = useState(currentStatus);
  const [savedStatus, setSavedStatus] = useState(currentStatus);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  if (lastServerStatus !== currentStatus) {
    setLastServerStatus(currentStatus);
    setSavedStatus(currentStatus);
    setSelectedStatus(currentStatus);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || selectedStatus === savedStatus) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}/application/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
      if (response.ok) {
        const updated = (await response.json()) as UpdatedApplication;
        setSavedStatus(updated.status);
        setSelectedStatus(updated.status);
        setFeedback({
          kind: "success",
          message: "応募ステータスを更新しました。",
        });
        router.refresh();
        return;
      }
      if (response.status === 401) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const error = (await response.json()) as ApiError;
      setFeedback({
        kind: "error",
        message:
          error.message ??
          "更新に失敗しました。時間をおいてもう一度お試しください。",
      });
      if (error.code === "APPLICATION_STATUS_UNCHANGED") router.refresh();
    } catch {
      setFeedback({
        kind: "error",
        message: "通信できませんでした。接続を確認してもう一度お試しください。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const unchanged = selectedStatus === savedStatus;

  return (
    <form
      className={`application-status-control${compact ? "application-status-control-compact" : ""}`}
      onSubmit={handleSubmit}
    >
      <label className={compact ? "sr-only" : undefined} htmlFor={controlId}>
        {jobName}の応募ステータス
      </label>
      <div className="application-status-fields">
        <select
          id={controlId}
          value={selectedStatus}
          disabled={isSubmitting}
          onChange={(event) => {
            setSelectedStatus(event.target.value as ApplicationStatusInput);
            setFeedback(null);
          }}
        >
          {APPLICATION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {APPLICATION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button
          className="primary-button"
          type="submit"
          disabled={unchanged || isSubmitting}
        >
          {isSubmitting ? "更新中…" : "更新"}
        </button>
      </div>
      {feedback ? (
        <p
          className={`application-status-feedback application-status-feedback-${feedback.kind}`}
          role={feedback.kind === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}
