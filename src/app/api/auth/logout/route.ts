import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api/error-response";
import { auth } from "@/lib/auth";
import { copySetCookieHeaders } from "@/lib/auth/response";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return errorResponse(
        401,
        "AUTHENTICATION_REQUIRED",
        "ログインしてください。",
      );
    }

    const authHeaders = new Headers(request.headers);
    authHeaders.set("content-type", "application/json");
    const authResponse = await auth.handler(
      new Request(new URL("/api/auth/sign-out", request.url), {
        method: "POST",
        headers: authHeaders,
        body: "{}",
      }),
    );

    if (!authResponse.ok) {
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
