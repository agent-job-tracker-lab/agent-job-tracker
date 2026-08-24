import { NextResponse } from "next/server";

import type { FieldError } from "@/lib/auth/login-input";

export type ApplicationErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "INTERNAL_ERROR"
  | "INVALID_CREDENTIALS"
  | "INVALID_JSON"
  | "ORIGIN_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "REQUEST_BODY_REQUIRED"
  | "REQUEST_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "VALIDATION_ERROR";

export function errorResponse(
  status: number,
  code: ApplicationErrorCode,
  message: string,
  fieldErrors: FieldError[] = [],
  headers?: HeadersInit,
) {
  return NextResponse.json({ code, message, fieldErrors }, { status, headers });
}
