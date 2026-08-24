import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/error-response";
import { auth } from "@/lib/auth";
import { loginRequestSchema, toLoginFieldErrors } from "@/lib/auth/login-input";
import { copySetCookieHeaders } from "@/lib/auth/response";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return errorResponse(
      415,
      "UNSUPPORTED_MEDIA_TYPE",
      "JSON形式で送信してください。",
    );
  }

  const rawBody = await request.text();
  if (rawBody.length === 0) {
    return errorResponse(
      400,
      "REQUEST_BODY_REQUIRED",
      "入力内容を送信してください。",
    );
  }

  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return errorResponse(
      413,
      "REQUEST_TOO_LARGE",
      "入力内容が大きすぎます。内容を短くしてください。",
    );
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "リクエストの形式が正しくありません。",
    );
  }

  const parsed = loginRequestSchema.safeParse(input);
  if (!parsed.success) {
    return errorResponse(
      422,
      "VALIDATION_ERROR",
      "入力内容を確認してください。",
      toLoginFieldErrors(parsed.error),
    );
  }

  try {
    const authHeaders = new Headers(request.headers);
    authHeaders.set("content-type", "application/json");
    const authResponse = await auth.handler(
      new Request(new URL("/api/auth/sign-in/email", request.url), {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ ...parsed.data, rememberMe: true }),
      }),
    );

    if (!authResponse.ok) {
      if (authResponse.status === 429) {
        const retryAfter =
          authResponse.headers.get("retry-after") ??
          authResponse.headers.get("x-retry-after") ??
          "10";

        return errorResponse(
          429,
          "RATE_LIMITED",
          "試行回数が上限に達しました。しばらく待ってからもう一度お試しください。",
          [],
          { "retry-after": retryAfter },
        );
      }

      if (authResponse.status === 400 || authResponse.status === 401) {
        return errorResponse(
          401,
          "INVALID_CREDENTIALS",
          "メールアドレスまたはパスワードが正しくありません。",
        );
      }

      if (authResponse.status === 403) {
        return errorResponse(
          403,
          "ORIGIN_NOT_ALLOWED",
          "この操作を実行できません。画面を再読み込みしてください。",
        );
      }

      return errorResponse(
        500,
        "INTERNAL_ERROR",
        "処理に失敗しました。時間をおいてもう一度お試しください。",
      );
    }

    const response = NextResponse.json({ success: true });
    copySetCookieHeaders(authResponse, response);
    return response;
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}
