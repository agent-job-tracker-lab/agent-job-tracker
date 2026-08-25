import {
  APPLICATION_STATUSES,
  toApplicationStatusFieldErrors,
  updateApplicationStatusRequestSchema,
} from "./input";

describe("updateApplicationStatusRequestSchema", () => {
  it.each(APPLICATION_STATUSES)("accepts %s", (status) => {
    expect(updateApplicationStatusRequestSchema.parse({ status })).toEqual({
      status,
    });
  });

  it("rejects missing, undefined, and unknown values", () => {
    for (const input of [
      {},
      { status: "UNKNOWN" },
      { status: "APPLIED", userId: "x" },
    ]) {
      const result = updateApplicationStatusRequestSchema.safeParse(input);
      expect(result.success).toBe(false);
    }
  });

  it("maps validation errors to the common field format", () => {
    const result = updateApplicationStatusRequestSchema.safeParse({
      status: "UNKNOWN",
      changedByUserId: "user-id",
    });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(toApplicationStatusFieldErrors(result.error)).toEqual(
      expect.arrayContaining([
        {
          field: "status",
          code: "INVALID_ENUM",
          message: "選択肢を確認してください。",
        },
        {
          field: "changedByUserId",
          code: "UNKNOWN_FIELD",
          message: "使用できない項目が含まれています。",
        },
      ]),
    );
  });
});
