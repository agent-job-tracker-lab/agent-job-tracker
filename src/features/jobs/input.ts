import { z } from "zod";

import type { ApplicationFieldError } from "@/lib/api/error-response";

export const WORK_STYLES = [
  "FULL_REMOTE",
  "HYBRID",
  "ONSITE",
  "UNKNOWN",
] as const;

export type WorkStyleInput = (typeof WORK_STYLES)[number];

export const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

const requiredSingleLine = (maximum: number) =>
  z
    .string({ error: requiredOrInvalid })
    .transform(normalizeString)
    .pipe(
      z
        .string()
        .min(1, "入力してください。")
        .refine(isSingleLine, "改行せず入力してください。")
        .refine(
          (value) => length(value) <= maximum,
          `${maximum}文字以内で入力してください。`,
        ),
    );

const optionalString = (maximum: number, singleLine = false) =>
  z
    .string({ error: "形式を確認してください。" })
    .nullable()
    .optional()
    .transform(normalizeNullableString)
    .superRefine((value, context) => {
      if (value === null) return;
      if (singleLine && !isSingleLine(value)) {
        context.addIssue({
          code: "custom",
          message: "改行せず入力してください。",
        });
      }
      if (length(value) > maximum) {
        context.addIssue({
          code: "custom",
          message: `${maximum}文字以内で入力してください。`,
        });
      }
    });

const requiredUuid = z
  .string({ error: requiredOrInvalid })
  .transform(normalizeString)
  .pipe(
    z.string().min(1, "入力してください。").uuid("形式を確認してください。"),
  );

const optionalRate = z
  .number({ error: "数値で入力してください。" })
  .int("整数で入力してください。")
  .min(0, "0から100000000の範囲で入力してください。")
  .max(100_000_000, "0から100000000の範囲で入力してください。")
  .multipleOf(100, "100円単位で入力してください。")
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const optionalUtilization = z
  .number({ error: "数値で入力してください。" })
  .min(0, "0から100の範囲で入力してください。")
  .max(100, "0から100の範囲で入力してください。")
  .refine(hasAtMostTwoDecimals, "小数点以下2桁以内で入力してください。")
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const optionalArray = z
  .array(z.string({ error: "形式を確認してください。" }))
  .nullable()
  .optional()
  .transform((values) => (values ?? []).map(normalizeString))
  .superRefine((values, context) => {
    if (values.length > 20) {
      context.addIssue({
        code: "custom",
        message: "20件以内で入力してください。",
      });
    }
    const seen = new Set<string>();
    values.forEach((value, index) => {
      if (value.length === 0) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: "入力してください。",
        });
      } else if (length(value) > 50) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: "50文字以内で入力してください。",
        });
      }
      if (seen.has(value)) {
        context.addIssue({
          code: "custom",
          path: [index],
          message: "同じ内容が重複しています。",
        });
      }
      seen.add(value);
    });
  });

export const createJobRequestSchema = z
  .object({
    jobName: requiredSingleLine(200),
    agentCompanyId: requiredUuid,
    companyName: optionalString(200, true),
    commercialFlow: optionalString(1000),
    monthlyRateMinYen: optionalRate,
    monthlyRateMaxYen: optionalRate,
    workStyle: z.enum(WORK_STYLES, { error: requiredOrInvalidEnum }),
    workStyleNotes: optionalString(500),
    prefecture: z
      .enum(PREFECTURES, { error: "選択肢を確認してください。" })
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    city: optionalString(100, true),
    nearestStation: optionalString(100, true),
    locationNotes: optionalString(500),
    utilizationPercent: optionalUtilization,
    technologies: optionalArray,
    processPhases: optionalArray,
    requiredConditions: optionalString(5000),
    preferredConditions: optionalString(5000),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.monthlyRateMinYen !== null &&
      value.monthlyRateMaxYen !== null &&
      value.monthlyRateMinYen > value.monthlyRateMaxYen
    ) {
      context.addIssue({
        code: "custom",
        path: ["monthlyRateMaxYen"],
        message: "上限は下限以上で入力してください。",
      });
    }
  });

export type CreateJobInput = z.output<typeof createJobRequestSchema>;

export type JobFormValues = {
  jobName: string;
  agentCompanyId: string;
  companyName: string;
  commercialFlow: string;
  monthlyRateMinManYen: string;
  monthlyRateMaxManYen: string;
  workStyle: "" | WorkStyleInput;
  workStyleNotes: string;
  prefecture: "" | (typeof PREFECTURES)[number];
  city: string;
  nearestStation: string;
  locationNotes: string;
  utilizationPercent: string;
  technologies: string;
  processPhases: string;
  requiredConditions: string;
  preferredConditions: string;
};

export const INITIAL_JOB_FORM_VALUES: JobFormValues = {
  jobName: "",
  agentCompanyId: "",
  companyName: "",
  commercialFlow: "",
  monthlyRateMinManYen: "",
  monthlyRateMaxManYen: "",
  workStyle: "",
  workStyleNotes: "",
  prefecture: "",
  city: "",
  nearestStation: "",
  locationNotes: "",
  utilizationPercent: "",
  technologies: "",
  processPhases: "",
  requiredConditions: "",
  preferredConditions: "",
};

export function parseJobForm(values: JobFormValues) {
  const rateMinimum = parseManYen(
    values.monthlyRateMinManYen,
    "monthlyRateMinManYen",
  );
  const rateMaximum = parseManYen(
    values.monthlyRateMaxManYen,
    "monthlyRateMaxManYen",
  );
  const utilization = parseUtilization(values.utilizationPercent);
  const directErrors = [
    rateMinimum.error,
    rateMaximum.error,
    utilization.error,
  ].filter((error): error is ApplicationFieldError => Boolean(error));
  const parsed = createJobRequestSchema.safeParse({
    jobName: values.jobName,
    agentCompanyId: values.agentCompanyId,
    companyName: values.companyName,
    commercialFlow: values.commercialFlow,
    monthlyRateMinYen: rateMinimum.value,
    monthlyRateMaxYen: rateMaximum.value,
    workStyle: values.workStyle,
    workStyleNotes: values.workStyleNotes,
    prefecture: values.prefecture || null,
    city: values.city,
    nearestStation: values.nearestStation,
    locationNotes: values.locationNotes,
    utilizationPercent: utilization.value,
    technologies: parseLines(values.technologies),
    processPhases: parseLines(values.processPhases),
    requiredConditions: values.requiredConditions,
    preferredConditions: values.preferredConditions,
  });
  if (!parsed.success) {
    const schemaErrors = toJobFieldErrors(parsed.error, true).filter(
      (error) => !directErrors.some((direct) => direct.field === error.field),
    );
    return {
      success: false as const,
      errors: sortFormErrors([...schemaErrors, ...directErrors]),
    };
  }
  if (directErrors.length > 0) {
    return { success: false as const, errors: sortFormErrors(directErrors) };
  }
  return { success: true as const, data: parsed.data };
}

export function toJobFieldErrors(error: z.ZodError, form = false) {
  const order = [
    "jobName",
    "agentCompanyId",
    "companyName",
    "commercialFlow",
    "monthlyRateMinYen",
    "monthlyRateMaxYen",
    "workStyle",
    "workStyleNotes",
    "prefecture",
    "city",
    "nearestStation",
    "locationNotes",
    "utilizationPercent",
    "technologies",
    "processPhases",
    "requiredConditions",
    "preferredConditions",
  ];
  const aliases: Record<string, string> = form
    ? {
        monthlyRateMinYen: "monthlyRateMinManYen",
        monthlyRateMaxYen: "monthlyRateMaxManYen",
      }
    : {};
  const errors = new Map<string, ApplicationFieldError>();
  for (const issue of error.issues) {
    if (issue.code === "unrecognized_keys") {
      issue.keys.forEach((key) =>
        errors.set(key, {
          field: key,
          code: "UNKNOWN_FIELD",
          message: "使用できない項目が含まれています。",
        }),
      );
      continue;
    }
    const apiField = String(issue.path[0] ?? "body");
    const field = aliases[apiField] ?? apiField;
    if (errors.has(field)) continue;
    errors.set(field, {
      field,
      code: fieldErrorCode(issue.message),
      message: issue.message,
    });
  }
  return [...errors.values()].sort((left, right) => {
    const apiLeft =
      Object.entries(aliases).find(([, value]) => value === left.field)?.[0] ??
      left.field;
    const apiRight =
      Object.entries(aliases).find(([, value]) => value === right.field)?.[0] ??
      right.field;
    return (
      normalizedOrder(order.indexOf(apiLeft), order.length) -
      normalizedOrder(order.indexOf(apiRight), order.length)
    );
  });
}

function parseManYen(
  value: string,
  field: "monthlyRateMinManYen" | "monthlyRateMaxManYen",
) {
  const normalized = value.trim();
  if (!normalized) return { value: null, error: null };
  if (!/^(0|[1-9][0-9]{0,4})(?:\.[0-9]{1,2})?$/u.test(normalized)) {
    return {
      value: null,
      error: {
        field,
        code: "INVALID_FORMAT",
        message:
          "0から10000の半角数字で、小数点以下2桁以内で入力してください。",
      },
    };
  }
  const [integer, fraction = ""] = normalized.split(".");
  const valueInYen =
    Number(integer) * 10_000 + Number(fraction.padEnd(2, "0")) * 100;
  if (valueInYen > 100_000_000) {
    return {
      value: null,
      error: {
        field,
        code: "OUT_OF_RANGE",
        message: "0から10000の範囲で入力してください。",
      },
    };
  }
  return { value: valueInYen, error: null };
}

function parseUtilization(value: string) {
  const normalized = value.trim();
  if (!normalized) return { value: null, error: null };
  if (!/^(0|[1-9][0-9]{0,2})(?:\.[0-9]{1,2})?$/u.test(normalized)) {
    return {
      value: null,
      error: {
        field: "utilizationPercent",
        code: "INVALID_FORMAT",
        message: "0から100の半角数字で、小数点以下2桁以内で入力してください。",
      },
    };
  }
  const numeric = Number(normalized);
  if (numeric > 100) {
    return {
      value: null,
      error: {
        field: "utilizationPercent",
        code: "OUT_OF_RANGE",
        message: "0から100の範囲で入力してください。",
      },
    };
  }
  return { value: numeric, error: null };
}

function parseLines(value: string) {
  return value.split(/\r?\n/u).map(normalizeString).filter(Boolean);
}

function requiredOrInvalid(issue: { input: unknown }) {
  return issue.input === undefined || issue.input === null
    ? "入力してください。"
    : "形式を確認してください。";
}
function requiredOrInvalidEnum(issue: { input: unknown }) {
  return issue.input === undefined || issue.input === null || issue.input === ""
    ? "入力してください。"
    : "選択肢を確認してください。";
}
function normalizeNullableString(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const normalized = normalizeString(value);
  return normalized || null;
}
function normalizeString(value: string) {
  return value
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .normalize("NFC")
    .trim();
}
function isSingleLine(value: string) {
  return !value.includes("\n");
}
function length(value: string) {
  return [...value].length;
}
function hasAtMostTwoDecimals(value: number) {
  return Number.isInteger(value * 100);
}
function normalizedOrder(index: number, fallback: number) {
  return index < 0 ? fallback : index;
}
function sortFormErrors(errors: ApplicationFieldError[]) {
  const order = [
    "jobName",
    "agentCompanyId",
    "companyName",
    "commercialFlow",
    "monthlyRateMinManYen",
    "monthlyRateMaxManYen",
    "workStyle",
    "workStyleNotes",
    "prefecture",
    "city",
    "nearestStation",
    "locationNotes",
    "utilizationPercent",
    "technologies",
    "processPhases",
    "requiredConditions",
    "preferredConditions",
  ];
  return errors.sort(
    (left, right) =>
      normalizedOrder(order.indexOf(left.field), order.length) -
      normalizedOrder(order.indexOf(right.field), order.length),
  );
}
function fieldErrorCode(message: string) {
  if (message === "入力してください。") return "REQUIRED";
  if (message.includes("20件以内")) return "TOO_MANY_ITEMS";
  if (message.includes("文字以内")) return "TOO_LONG";
  if (message.includes("範囲")) return "OUT_OF_RANGE";
  if (message.includes("100円単位")) return "INVALID_INCREMENT";
  if (message.includes("小数点以下")) return "TOO_MANY_DECIMALS";
  if (message === "選択肢を確認してください。") return "INVALID_ENUM";
  if (message === "同じ内容が重複しています。") return "DUPLICATE_ITEM";
  if (message === "上限は下限以上で入力してください。")
    return "INCONSISTENT_RANGE";
  if (
    message === "数値で入力してください。" ||
    message === "整数で入力してください。"
  )
    return "INVALID_TYPE";
  return "INVALID_FORMAT";
}
