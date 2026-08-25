import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createJobRequestSchema,
  toJobFieldErrors,
} from "@/features/jobs/input";
import {
  AgentCompanyUnavailableError,
  JobUnavailableError,
  updateJob,
} from "@/features/jobs/mutations";
import { getJobDetail } from "@/features/jobs/queries";
import { errorResponse } from "@/lib/api/error-response";
import { isAllowedOrigin, readJsonBody } from "@/lib/api/request";
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
    return NextResponse.json(await updateJob(jobId, parsed.data));
  } catch (error) {
    if (error instanceof JobUnavailableError) {
      return errorResponse(404, "JOB_NOT_FOUND", "案件が見つかりません。");
    }
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
