import { NextResponse } from "next/server";
import { z } from "zod";

import { getAgentCompanyDetail } from "@/features/agent-companies/queries";
import { errorResponse } from "@/lib/api/error-response";
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
