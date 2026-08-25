export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type Pagination = {
  page: number;
  pageSize: number;
};

export type PaginationError = {
  field: "query.page" | "query.pageSize" | "query";
  code: "INVALID_FORMAT" | "OUT_OF_RANGE" | "UNKNOWN_FIELD";
  message: string;
};

export type PaginationResult =
  | { success: true; data: Pagination }
  | { success: false; error: PaginationError };

const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/u;
const ALLOWED_PARAMETERS = new Set(["page", "pageSize"]);

export function parsePagination(params: URLSearchParams): PaginationResult {
  for (const key of params.keys()) {
    if (!ALLOWED_PARAMETERS.has(key)) {
      return {
        success: false,
        error: {
          field: "query",
          code: "UNKNOWN_FIELD",
          message: "指定できない一覧条件が含まれています。",
        },
      };
    }

    if (params.getAll(key).length > 1) {
      return {
        success: false,
        error: {
          field: key === "page" ? "query.page" : "query.pageSize",
          code: "INVALID_FORMAT",
          message: "一覧の指定形式を確認してください。",
        },
      };
    }
  }

  const pageResult = parsePositiveInteger(
    params.get("page"),
    DEFAULT_PAGE,
    "query.page",
  );
  if (!pageResult.success) return pageResult;

  const pageSizeResult = parsePositiveInteger(
    params.get("pageSize"),
    DEFAULT_PAGE_SIZE,
    "query.pageSize",
    MAX_PAGE_SIZE,
  );
  if (!pageSizeResult.success) return pageSizeResult;

  return {
    success: true,
    data: { page: pageResult.value, pageSize: pageSizeResult.value },
  };
}

function parsePositiveInteger(
  value: string | null,
  defaultValue: number,
  field: "query.page" | "query.pageSize",
  maximum?: number,
):
  | { success: true; value: number }
  | { success: false; error: PaginationError } {
  if (value === null) return { success: true, value: defaultValue };

  if (!POSITIVE_INTEGER_PATTERN.test(value)) {
    return {
      success: false,
      error: {
        field,
        code: "INVALID_FORMAT",
        message: "1以上の整数で指定してください。",
      },
    };
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || (maximum && parsed > maximum)) {
    return {
      success: false,
      error: {
        field,
        code: "OUT_OF_RANGE",
        message: maximum
          ? `${maximum}以下で指定してください。`
          : "指定できる範囲を超えています。",
      },
    };
  }

  return { success: true, value: parsed };
}
