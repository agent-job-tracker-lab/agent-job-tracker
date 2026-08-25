import {
  APPLICATION_STATUS_LABELS,
  formatLocation,
  formatMonthlyRate,
  WORK_STYLE_LABELS,
} from "./presentation";

describe("job presentation", () => {
  it("uses the approved work-style and application-status labels", () => {
    expect(WORK_STYLE_LABELS).toMatchObject({
      FULL_REMOTE: "フルリモート",
      HYBRID: "ハイブリッド",
      ONSITE: "常駐",
      UNKNOWN: "未確認",
    });
    expect(APPLICATION_STATUS_LABELS).toMatchObject({
      NOT_APPLIED: "未応募",
      APPLIED: "応募済み",
      ENGAGEMENT_CONFIRMED: "参画決定",
      REJECTED: "見送り",
    });
  });

  it.each([
    [null, null, "未登録"],
    [600_000, null, "60万円〜"],
    [null, 800_000, "〜80万円"],
    [600_000, 800_000, "60〜80万円"],
    [602_500, 602_500, "60.25万円"],
  ])("formats monthly rate %s-%s", (minimum, maximum, expected) => {
    expect(formatMonthlyRate(minimum, maximum)).toBe(expected);
  });

  it("formats available location parts without inventing missing data", () => {
    expect(
      formatLocation({
        prefecture: "東京都",
        city: "新宿区",
        nearestStation: "新宿駅",
      }),
    ).toBe("東京都新宿区（新宿駅）");
    expect(
      formatLocation({ prefecture: null, city: null, nearestStation: null }),
    ).toBe("未登録");
  });
});
