import { NextResponse } from "next/server";

import {
  createAgentCompanyRequestSchema,
  toAgentCompanyFieldErrors,
} from "@/features/agent-companies/input";
import { createAgentCompany } from "@/features/agent-companies/mutations";
import { parsePagination } from "@/features/agent-companies/pagination";
import { listAgentCompanies } from "@/features/agent-companies/queries";
import { errorResponse } from "@/lib/api/error-response";
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
    return NextResponse.json(await listAgentCompanies(pagination.data));
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

  const parsed = createAgentCompanyRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(
      422,
      "VALIDATION_ERROR",
      "入力内容を確認してください。",
      toAgentCompanyFieldErrors(parsed.error),
    );
  }

  try {
    const company = await createAgentCompany(parsed.data);
    return NextResponse.json(company, {
      status: 201,
      headers: {
        location: `/api/agent-companies/${company.id}`,
      },
    });
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}
