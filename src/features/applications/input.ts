import { z } from "zod";

import type { ApplicationFieldError } from "@/lib/api/error-response";

export const APPLICATION_STATUSES = [
  "NOT_APPLIED",
  "PROPOSING",
  "APPLIED",
  "DOCUMENT_REVIEW",
  "INTERVIEW_SCHEDULED",
  "AWAITING_RESULT",
  "ENGAGEMENT_CONFIRMED",
  "WITHDRAWN",
  "REJECTED",
] as const;

export type ApplicationStatusInput = (typeof APPLICATION_STATUSES)[number];

export const updateApplicationStatusRequestSchema = z
  .object({
    status: z.enum(APPLICATION_STATUSES, {
      error: (issue) =>
        issue.input === undefined || issue.input === null || issue.input === ""
          ? "入力してください。"
          : "選択肢を確認してください。",
    }),
  })
  .strict();

export type UpdateApplicationStatusInput = z.output<
  typeof updateApplicationStatusRequestSchema
>;

export function toApplicationStatusFieldErrors(error: z.ZodError) {
  const errors: ApplicationFieldError[] = [];
  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      issue.keys.forEach((key) =>
        errors.push({
          field: key,
          code: "UNKNOWN_FIELD",
          message: "使用できない項目が含まれています。",
        }),
      );
      continue;
    }
    errors.push({
      field: String(issue.path[0] ?? "body"),
      code:
        issue.message === "入力してください。" ? "REQUIRED" : "INVALID_ENUM",
      message: issue.message,
    });
  }
  return errors;
}
