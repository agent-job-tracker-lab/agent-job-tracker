import { z } from "zod";

import type { ApplicationFieldError } from "@/lib/api/error-response";

export const AGENT_COMPANY_STATUSES = ["ACTIVE", "ON_HOLD", "ENDED"] as const;

export type AgentCompanyStatusInput = (typeof AGENT_COMPANY_STATUSES)[number];

const requiredCompanyNameSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined || issue.input === null
        ? "入力してください。"
        : "形式を確認してください。",
  })
  .transform(normalizeBusinessString)
  .pipe(
    z
      .string()
      .min(1, "入力してください。")
      .refine(isSingleLine, "改行せず入力してください。")
      .refine(
        (value) => codePointLength(value) <= 200,
        "200文字以内で入力してください。",
      ),
  );

const optionalContactNameSchema = optionalStringSchema({
  maximum: 100,
  singleLine: true,
});
const optionalContactDetailsSchema = optionalStringSchema({ maximum: 500 });
const optionalCharacteristicsSchema = optionalStringSchema({ maximum: 2000 });

const optionalLastContactDateSchema = z
  .string({ error: "日付を正しく入力してください。" })
  .nullable()
  .optional()
  .transform((value) => normalizeNullableString(value))
  .superRefine((value, context) => {
    if (value === null) return;

    if (!isValidCalendarDate(value)) {
      context.addIssue({
        code: "custom",
        message: "日付を正しく入力してください。",
      });
      return;
    }

    if (value > todayInTokyo()) {
      context.addIssue({
        code: "custom",
        message: "今日以前の日付を入力してください。",
      });
    }
  });

const statusSchema = z.enum(AGENT_COMPANY_STATUSES, {
  error: (issue) =>
    issue.input === undefined || issue.input === null || issue.input === ""
      ? "入力してください。"
      : "選択肢を確認してください。",
});

export const createAgentCompanyRequestSchema = z
  .object({
    companyName: requiredCompanyNameSchema,
    contactName: optionalContactNameSchema,
    contactDetails: optionalContactDetailsSchema,
    characteristics: optionalCharacteristicsSchema,
    lastContactDate: optionalLastContactDateSchema,
    status: statusSchema,
  })
  .strict();

export const agentCompanyFormSchema = createAgentCompanyRequestSchema;

export type AgentCompanyInput = z.output<
  typeof createAgentCompanyRequestSchema
>;

export function toAgentCompanyFieldErrors(
  error: z.ZodError,
): ApplicationFieldError[] {
  const fieldOrder = [
    "companyName",
    "contactName",
    "contactDetails",
    "characteristics",
    "lastContactDate",
    "status",
  ];
  const errors = new Map<string, ApplicationFieldError>();

  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        if (!errors.has(key)) {
          errors.set(key, {
            field: key,
            code: "UNKNOWN_FIELD",
            message: "使用できない項目が含まれています。",
          });
        }
      }
      continue;
    }

    const field = String(issue.path[0] ?? "body");
    if (errors.has(field)) continue;

    const message =
      field === "body" ? "入力内容の形式を確認してください。" : issue.message;
    errors.set(field, {
      field,
      code: fieldErrorCode(message),
      message,
    });
  }

  return [...errors.values()].sort((left, right) => {
    const leftIndex = fieldOrder.indexOf(left.field);
    const rightIndex = fieldOrder.indexOf(right.field);
    return (
      (leftIndex < 0 ? fieldOrder.length : leftIndex) -
      (rightIndex < 0 ? fieldOrder.length : rightIndex)
    );
  });
}

function optionalStringSchema({
  maximum,
  singleLine = false,
}: {
  maximum: number;
  singleLine?: boolean;
}) {
  return z
    .string({ error: "形式を確認してください。" })
    .nullable()
    .optional()
    .transform((value) => normalizeNullableString(value))
    .superRefine((value, context) => {
      if (value === null) return;

      if (singleLine && !isSingleLine(value)) {
        context.addIssue({
          code: "custom",
          message: "改行せず入力してください。",
        });
      }

      if (codePointLength(value) > maximum) {
        context.addIssue({
          code: "custom",
          message: `${maximum}文字以内で入力してください。`,
        });
      }
    });
}

function normalizeNullableString(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const normalized = normalizeBusinessString(value);
  return normalized.length === 0 ? null : normalized;
}

function normalizeBusinessString(value: string) {
  return value
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .normalize("NFC")
    .trim();
}

function codePointLength(value: string) {
  return [...value].length;
}

function isSingleLine(value: string) {
  return !value.includes("\n");
}

function isValidCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
}

function todayInTokyo() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function fieldErrorCode(message: string) {
  if (message === "入力してください。") return "REQUIRED";
  if (message.includes("文字以内")) return "TOO_LONG";
  if (message === "日付を正しく入力してください。") return "INVALID_DATE";
  if (message === "今日以前の日付を入力してください。") return "FUTURE_DATE";
  if (message === "選択肢を確認してください。") return "INVALID_ENUM";
  return "INVALID_FORMAT";
}
