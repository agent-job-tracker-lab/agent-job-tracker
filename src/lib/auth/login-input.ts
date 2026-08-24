import { z } from "zod";

const emailSchema = z
  .string({ error: "入力してください。" })
  .transform((value) => value.trim().normalize("NFC").toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "入力してください。")
      .max(254, "254文字以内で入力してください。")
      .refine((value) => !/[\r\n]/u.test(value), "形式を確認してください。")
      .email("形式を確認してください。"),
  );

const passwordSchema = z
  .string({ error: "入力してください。" })
  .min(1, "入力してください。")
  .min(8, "8文字以上で入力してください。")
  .max(128, "128文字以内で入力してください。");

export const loginRequestSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;

export type FieldError = {
  field: "email" | "password";
  code: "REQUIRED" | "INVALID_FORMAT" | "TOO_SHORT" | "TOO_LONG";
  message: string;
};

export function toLoginFieldErrors(error: z.ZodError): FieldError[] {
  const seen = new Set<string>();

  return error.issues.flatMap((issue) => {
    const field = issue.path[0];

    if ((field !== "email" && field !== "password") || seen.has(field)) {
      return [];
    }

    seen.add(field);

    const message = issue.message;
    const code =
      message === "入力してください。"
        ? "REQUIRED"
        : message.includes("以上")
          ? "TOO_SHORT"
          : message.includes("以内")
            ? "TOO_LONG"
            : "INVALID_FORMAT";

    return [{ field, code, message }];
  });
}
