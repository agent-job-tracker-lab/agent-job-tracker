import { NextResponse } from "next/server";
import { z } from "zod";

import { getJobDetail } from "@/features/jobs/queries";
import { errorResponse } from "@/lib/api/error-response";
import { auth } from "@/lib/auth";

const jobIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ jobId: string }>;
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

  const { jobId } = await context.params;
  if (!jobIdSchema.safeParse(jobId).success) {
    return errorResponse(
      400,
      "INVALID_PATH_PARAMETER",
      "指定されたIDの形式が正しくありません。",
      [
        {
          field: "path.jobId",
          code: "INVALID_FORMAT",
          message: "IDの形式を確認してください。",
        },
      ],
    );
  }

  try {
    const job = await getJobDetail(jobId);
    if (!job) {
      return errorResponse(404, "JOB_NOT_FOUND", "案件が見つかりません。");
    }

    return NextResponse.json(job);
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}
