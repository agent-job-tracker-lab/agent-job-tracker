import { NextResponse } from "next/server";

import { listJobs } from "@/features/jobs/queries";
import { errorResponse } from "@/lib/api/error-response";
import { parsePagination } from "@/lib/api/pagination";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return errorResponse(
      401,
      "AUTHENTICATION_REQUIRED",
      "ログインしてください。",
    );
  }

  const pagination = parsePagination(new URL(request.url).searchParams);
  if (!pagination.success) {
    return errorResponse(
      400,
      "INVALID_QUERY_PARAMETER",
      "一覧の指定が正しくありません。",
      [pagination.error],
    );
  }

  try {
    return NextResponse.json(await listJobs(pagination.data));
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}
