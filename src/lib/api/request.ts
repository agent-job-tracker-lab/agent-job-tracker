import { errorResponse } from "./error-response";

const MAX_JSON_BODY_BYTES = 64 * 1024;

export async function readJsonBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_JSON_BODY_BYTES) {
    return {
      success: false as const,
      response: requestTooLargeResponse(),
    };
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_JSON_BODY_BYTES) {
    return {
      success: false as const,
      response: requestTooLargeResponse(),
    };
  }

  if (!isJsonContentType(request.headers.get("content-type"))) {
    return {
      success: false as const,
      response: errorResponse(
        415,
        "UNSUPPORTED_MEDIA_TYPE",
        "JSON形式で送信してください。",
      ),
    };
  }

  if (rawBody.length === 0) {
    return {
      success: false as const,
      response: errorResponse(
        400,
        "REQUEST_BODY_REQUIRED",
        "入力内容を送信してください。",
      ),
    };
  }

  try {
    return { success: true as const, data: JSON.parse(rawBody) as unknown };
  } catch {
    return {
      success: false as const,
      response: errorResponse(
        400,
        "INVALID_JSON",
        "リクエストの形式が正しくありません。",
      ),
    };
  }
}

export function isAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configuredUrl = process.env.BETTER_AUTH_URL;
  if (!origin || !configuredUrl) return false;

  try {
    return (
      new URL(origin).origin === origin &&
      new URL(origin).origin === new URL(configuredUrl).origin
    );
  } catch {
    return false;
  }
}

function isJsonContentType(value: string | null) {
  return /^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?\s*$/iu.test(
    value ?? "",
  );
}

function requestTooLargeResponse() {
  return errorResponse(
    413,
    "REQUEST_TOO_LARGE",
    "入力内容が大きすぎます。内容を短くしてください。",
  );
}
