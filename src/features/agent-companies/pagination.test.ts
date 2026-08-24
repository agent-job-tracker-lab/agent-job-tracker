import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parsePagination,
} from "./pagination";

describe("parsePagination", () => {
  it("uses the documented defaults", () => {
    expect(parsePagination(new URLSearchParams())).toEqual({
      success: true,
      data: { page: DEFAULT_PAGE, pageSize: DEFAULT_PAGE_SIZE },
    });
  });

  it("accepts positive decimal integers within the allowed range", () => {
    expect(
      parsePagination(
        new URLSearchParams({ page: "12", pageSize: String(MAX_PAGE_SIZE) }),
      ),
    ).toEqual({
      success: true,
      data: { page: 12, pageSize: MAX_PAGE_SIZE },
    });
  });

  it.each(["", "0", "1.0", "1e2", "+1", "-1", "abc"])(
    "rejects page=%s",
    (page) => {
      expect(parsePagination(new URLSearchParams({ page }))).toMatchObject({
        success: false,
        error: { field: "query.page", code: "INVALID_FORMAT" },
      });
    },
  );

  it("rejects a page size over the documented maximum", () => {
    expect(
      parsePagination(
        new URLSearchParams({ pageSize: String(MAX_PAGE_SIZE + 1) }),
      ),
    ).toMatchObject({
      success: false,
      error: { field: "query.pageSize", code: "OUT_OF_RANGE" },
    });
  });

  it("rejects duplicate and unknown query parameters", () => {
    expect(parsePagination(new URLSearchParams("page=1&page=2"))).toMatchObject(
      {
        success: false,
        error: { field: "query.page", code: "INVALID_FORMAT" },
      },
    );
    expect(
      parsePagination(new URLSearchParams({ search: "example" })),
    ).toMatchObject({
      success: false,
      error: { field: "query", code: "UNKNOWN_FIELD" },
    });
  });
});
