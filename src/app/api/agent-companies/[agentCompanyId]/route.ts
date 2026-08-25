import { NextResponse } from "next/server";
import { z } from "zod";

import {
  toAgentCompanyFieldErrors,
  updateAgentCompanyRequestSchema,
} from "@/features/agent-companies/input";
import { updateAgentCompany } from "@/features/agent-companies/mutations";
import { getAgentCompanyDetail } from "@/features/agent-companies/queries";
import { errorResponse } from "@/lib/api/error-response";
import { isAllowedOrigin, readJsonBody } from "@/lib/api/request";
import { auth } from "@/lib/auth";

const agentCompanyIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ agentCompanyId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return errorResponse(
      401,
      "AUTHENTICATION_REQUIRED",
      "ログインしてください。",
    );
  }

  const { agentCompanyId } = await context.params;
  if (!agentCompanyIdSchema.safeParse(agentCompanyId).success) {
    return errorResponse(
      400,
      "INVALID_PATH_PARAMETER",
      "指定されたIDの形式が正しくありません。",
      [
        {
          field: "path.agentCompanyId",
          code: "INVALID_FORMAT",
          message: "IDの形式を確認してください。",
        },
      ],
    );
  }

  try {
    const company = await getAgentCompanyDetail(agentCompanyId);
    if (!company) {
      return errorResponse(
        404,
        "AGENT_COMPANY_NOT_FOUND",
        "エージェント会社が見つかりません。",
      );
    }

    return NextResponse.json(company);
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const { agentCompanyId } = await context.params;
  if (!agentCompanyIdSchema.safeParse(agentCompanyId).success) {
    return errorResponse(
      400,
      "INVALID_PATH_PARAMETER",
      "指定されたIDの形式が正しくありません。",
      [
        {
          field: "path.agentCompanyId",
          code: "INVALID_FORMAT",
          message: "IDの形式を確認してください。",
        },
      ],
    );
  }

  const parsed = updateAgentCompanyRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(
      422,
      "VALIDATION_ERROR",
      "入力内容を確認してください。",
      toAgentCompanyFieldErrors(parsed.error),
    );
  }

  try {
    const company = await updateAgentCompany(agentCompanyId, parsed.data);
    if (!company) {
      return errorResponse(
        404,
        "AGENT_COMPANY_NOT_FOUND",
        "エージェント会社が見つかりません。",
      );
    }

    return NextResponse.json(company);
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}
