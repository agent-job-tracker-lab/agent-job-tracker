import {
  createJobRequestSchema,
  INITIAL_JOB_FORM_VALUES,
  parseJobForm,
  toJobFieldErrors,
} from "./input";

function validApiInput(overrides: Record<string, unknown> = {}) {
  return {
    jobName: "案件",
    agentCompanyId: "123e4567-e89b-42d3-a456-426614174000",
    workStyle: "HYBRID",
    ...overrides,
  };
}

describe("createJobRequestSchema", () => {
  it("normalizes optional values and arrays", () => {
    expect(
      createJobRequestSchema.parse(
        validApiInput({
          jobName: "  案件  ",
          companyName: " ",
          commercialFlow: " 元請け\r\n一次請け ",
          monthlyRateMinYen: 602_500,
          utilizationPercent: 80.25,
          technologies: [" TypeScript ", "Next.js"],
        }),
      ),
    ).toMatchObject({
      jobName: "案件",
      companyName: null,
      commercialFlow: "元請け\n一次請け",
      monthlyRateMinYen: 602_500,
      utilizationPercent: 80.25,
      technologies: ["TypeScript", "Next.js"],
      processPhases: [],
    });
  });

  it("requires job name, company, and an explicitly selected work style", () => {
    const result = createJobRequestSchema.safeParse({});
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(toJobFieldErrors(result.error)).toEqual([
      { field: "jobName", code: "REQUIRED", message: "入力してください。" },
      {
        field: "agentCompanyId",
        code: "REQUIRED",
        message: "入力してください。",
      },
      { field: "workStyle", code: "REQUIRED", message: "入力してください。" },
    ]);
  });

  it("validates rates, ranges, and utilization", () => {
    const result = createJobRequestSchema.safeParse(
      validApiInput({
        monthlyRateMinYen: 800_000,
        monthlyRateMaxYen: 600_000,
        utilizationPercent: 99.999,
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(toJobFieldErrors(result.error)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "monthlyRateMaxYen",
          code: "INCONSISTENT_RANGE",
        }),
        expect.objectContaining({
          field: "utilizationPercent",
          code: "TOO_MANY_DECIMALS",
        }),
      ]),
    );
  });

  it("rejects unknown fields", () => {
    const result = createJobRequestSchema.safeParse(
      validApiInput({ applicationStatus: "APPLIED" }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(toJobFieldErrors(result.error)).toContainEqual(
      expect.objectContaining({
        field: "applicationStatus",
        code: "UNKNOWN_FIELD",
      }),
    );
  });

  it("rejects duplicate and overlong list items", () => {
    const result = createJobRequestSchema.safeParse(
      validApiInput({
        technologies: ["TypeScript", "TypeScript", "x".repeat(51)],
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(toJobFieldErrors(result.error)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "technologies",
          code: "DUPLICATE_ITEM",
        }),
      ]),
    );
  });
});

describe("parseJobForm", () => {
  it("has no initial work-style selection", () => {
    expect(INITIAL_JOB_FORM_VALUES.workStyle).toBe("");
  });

  it("converts man-yen strings exactly and line-separated lists", () => {
    const result = parseJobForm({
      ...INITIAL_JOB_FORM_VALUES,
      jobName: "案件",
      agentCompanyId: "123e4567-e89b-42d3-a456-426614174000",
      workStyle: "FULL_REMOTE",
      monthlyRateMinManYen: "60.25",
      monthlyRateMaxManYen: "100",
      utilizationPercent: "80.5",
      technologies: "TypeScript\nNext.js\n",
      processPhases: "設計\n実装",
    });
    expect(result).toMatchObject({
      success: true,
      data: {
        monthlyRateMinYen: 602_500,
        monthlyRateMaxYen: 1_000_000,
        utilizationPercent: 80.5,
        technologies: ["TypeScript", "Next.js"],
        processPhases: ["設計", "実装"],
      },
    });
  });

  it("reports required and form-format errors in screen order", () => {
    const result = parseJobForm({
      ...INITIAL_JOB_FORM_VALUES,
      monthlyRateMinManYen: "60.123",
      utilizationPercent: "１０",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.errors.map(({ field, code }) => ({ field, code }))).toEqual([
      { field: "jobName", code: "REQUIRED" },
      { field: "agentCompanyId", code: "REQUIRED" },
      { field: "monthlyRateMinManYen", code: "INVALID_FORMAT" },
      { field: "workStyle", code: "REQUIRED" },
      { field: "utilizationPercent", code: "INVALID_FORMAT" },
    ]);
  });
});
