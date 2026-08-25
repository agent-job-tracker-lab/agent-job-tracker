import { NextResponse } from "next/server";

import {
  createJobRequestSchema,
  toJobFieldErrors,
} from "@/features/jobs/input";
import {
  AgentCompanyUnavailableError,
  createJobWithApplication,
} from "@/features/jobs/mutations";
import { listJobs } from "@/features/jobs/queries";
import { errorResponse } from "@/lib/api/error-response";
import { parsePagination } from "@/lib/api/pagination";
import { isAllowedOrigin, readJsonBody } from "@/lib/api/request";
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

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.success) return body.response;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return errorResponse(
      401,
      "AUTHENTICATION_REQUIRED",
      "ログインしてください。",
    );
  }

  if (!isAllowedOrigin(request)) {
    return errorResponse(
      403,
      "ORIGIN_NOT_ALLOWED",
      "この操作を実行できません。画面を再読み込みしてください。",
    );
  }

  const parsed = createJobRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(
      422,
      "VALIDATION_ERROR",
      "入力内容を確認してください。",
      toJobFieldErrors(parsed.error),
    );
  }

  try {
    const job = await createJobWithApplication(parsed.data);
    return NextResponse.json(job, {
      status: 201,
      headers: { location: `/api/jobs/${job.id}` },
    });
  } catch (error) {
    if (error instanceof AgentCompanyUnavailableError) {
      return errorResponse(
        404,
        "AGENT_COMPANY_NOT_FOUND",
        "エージェント会社が見つかりません。",
      );
    }
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}
