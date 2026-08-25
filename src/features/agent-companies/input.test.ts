import {
  createAgentCompanyRequestSchema,
  toAgentCompanyFieldErrors,
} from "./input";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    companyName: "サンプルエージェント株式会社",
    status: "ACTIVE",
    ...overrides,
  };
}

describe("createAgentCompanyRequestSchema", () => {
  it("normalizes business strings and optional blank values", () => {
    const result = createAgentCompanyRequestSchema.parse(
      validInput({
        companyName: "  Cafe\u0301株式会社  ",
        contactName: "   ",
        contactDetails: " 電話\r\nメール ",
        characteristics: null,
        lastContactDate: "2024-02-29",
      }),
    );

    expect(result).toEqual({
      companyName: "Café株式会社",
      contactName: null,
      contactDetails: "電話\nメール",
      characteristics: null,
      lastContactDate: "2024-02-29",
      status: "ACTIVE",
    });
  });

  it("requires the company name and status in schema order", () => {
    const result = createAgentCompanyRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(toAgentCompanyFieldErrors(result.error)).toEqual([
      {
        field: "companyName",
        code: "REQUIRED",
        message: "入力してください。",
      },
      { field: "status", code: "REQUIRED", message: "入力してください。" },
    ]);
  });

  it("distinguishes a non-string company name from a missing value", () => {
    const result = createAgentCompanyRequestSchema.safeParse(
      validInput({ companyName: 123 }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(toAgentCompanyFieldErrors(result.error)).toContainEqual({
      field: "companyName",
      code: "INVALID_FORMAT",
      message: "形式を確認してください。",
    });
  });

  it("counts Unicode code points instead of UTF-16 code units", () => {
    expect(
      createAgentCompanyRequestSchema.safeParse(
        validInput({ companyName: "😀".repeat(200) }),
      ).success,
    ).toBe(true);

    const result = createAgentCompanyRequestSchema.safeParse(
      validInput({ companyName: "😀".repeat(201) }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toAgentCompanyFieldErrors(result.error)).toContainEqual({
      field: "companyName",
      code: "TOO_LONG",
      message: "200文字以内で入力してください。",
    });
  });

  it("rejects newlines in single-line fields", () => {
    const result = createAgentCompanyRequestSchema.safeParse(
      validInput({ contactName: "担当\r\n者" }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toAgentCompanyFieldErrors(result.error)).toContainEqual({
      field: "contactName",
      code: "INVALID_FORMAT",
      message: "改行せず入力してください。",
    });
  });

  it.each([
    ["2025-02-29", "INVALID_DATE", "日付を正しく入力してください。"],
    ["2999-01-01", "FUTURE_DATE", "今日以前の日付を入力してください。"],
  ])("rejects lastContactDate=%s", (date, code, message) => {
    const result = createAgentCompanyRequestSchema.safeParse(
      validInput({ lastContactDate: date }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toAgentCompanyFieldErrors(result.error)).toContainEqual({
      field: "lastContactDate",
      code,
      message,
    });
  });

  it("rejects unknown fields and undefined status values", () => {
    const result = createAgentCompanyRequestSchema.safeParse(
      validInput({ status: "UNKNOWN", deletedAt: null }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toAgentCompanyFieldErrors(result.error)).toEqual([
      {
        field: "status",
        code: "INVALID_ENUM",
        message: "選択肢を確認してください。",
      },
      {
        field: "deletedAt",
        code: "UNKNOWN_FIELD",
        message: "使用できない項目が含まれています。",
      },
    ]);
  });
});
