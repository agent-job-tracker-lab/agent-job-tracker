import { NextResponse } from "next/server";

export function copySetCookieHeaders(from: Response, to: NextResponse) {
  const headers = from.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = headers.getSetCookie?.() ?? [];

  if (setCookies.length > 0) {
    for (const value of setCookies) {
      to.headers.append("set-cookie", value);
    }
    return;
  }

  const setCookie = from.headers.get("set-cookie");
  if (setCookie) {
    to.headers.set("set-cookie", setCookie);
  }
}
