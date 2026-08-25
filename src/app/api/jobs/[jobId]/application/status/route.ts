import { NextResponse } from "next/server";
import { z } from "zod";

import {
  toApplicationStatusFieldErrors,
  updateApplicationStatusRequestSchema,
} from "@/features/applications/input";
import {
  ApplicationJobUnavailableError,
  ApplicationStatusUnchangedError,
  ApplicationUnavailableError,
  updateApplicationStatus,
} from "@/features/applications/mutations";
import { errorResponse } from "@/lib/api/error-response";
import { isAllowedOrigin, readJsonBody } from "@/lib/api/request";
import { auth } from "@/lib/auth";

const jobIdSchema = z.uuid();

type RouteContext = { params: Promise<{ jobId: string }> };

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

  const parsed = updateApplicationStatusRequestSchema.safeParse(body.data);
  if (!parsed.success) {
    return errorResponse(
      422,
      "VALIDATION_ERROR",
      "入力内容を確認してください。",
      toApplicationStatusFieldErrors(parsed.error),
    );
  }

  try {
    return NextResponse.json(
      await updateApplicationStatus(jobId, parsed.data, session.user.id),
    );
  } catch (error) {
    if (error instanceof ApplicationJobUnavailableError) {
      return errorResponse(404, "JOB_NOT_FOUND", "案件が見つかりません。");
    }
    if (error instanceof ApplicationUnavailableError) {
      return errorResponse(
        404,
        "APPLICATION_NOT_FOUND",
        "応募情報が見つかりません。",
      );
    }
    if (error instanceof ApplicationStatusUnchangedError) {
      return errorResponse(
        409,
        "APPLICATION_STATUS_UNCHANGED",
        "現在と同じステータスには更新できません。",
        [
          {
            field: "status",
            code: "UNCHANGED",
            message: "現在と異なるステータスを選択してください。",
          },
        ],
      );
    }
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "処理に失敗しました。時間をおいてもう一度お試しください。",
    );
  }
}
