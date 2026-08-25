import { NextResponse } from "next/server";

export type ApplicationErrorCode =
  | "AGENT_COMPANY_NOT_FOUND"
  | "APPLICATION_NOT_FOUND"
  | "APPLICATION_STATUS_UNCHANGED"
  | "AUTHENTICATION_REQUIRED"
  | "INTERNAL_ERROR"
  | "INVALID_CREDENTIALS"
  | "INVALID_JSON"
  | "INVALID_PATH_PARAMETER"
  | "INVALID_QUERY_PARAMETER"
  | "JOB_NOT_FOUND"
  | "ORIGIN_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "REQUEST_BODY_REQUIRED"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "VALIDATION_ERROR";

export type ApplicationFieldError = {
  field: string;
  code: string;
  message: string;
};

export function errorResponse(
  status: number,
  code: ApplicationErrorCode,
  message: string,
  fieldErrors: ApplicationFieldError[] = [],
  headers?: HeadersInit,
) {
  return NextResponse.json({ code, message, fieldErrors }, { status, headers });
}
