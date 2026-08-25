import type { ApplicationStatus, WorkStyle } from "@/generated/prisma/client";

export const WORK_STYLE_LABELS: Record<WorkStyle, string> = {
  FULL_REMOTE: "フルリモート",
  HYBRID: "ハイブリッド",
  ONSITE: "常駐",
  UNKNOWN: "未確認",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  NOT_APPLIED: "未応募",
  PROPOSING: "提案中",
  APPLIED: "応募済み",
  DOCUMENT_REVIEW: "書類確認",
  INTERVIEW_SCHEDULED: "面談予定",
  AWAITING_RESULT: "結果待ち",
  ENGAGEMENT_CONFIRMED: "参画決定",
  WITHDRAWN: "辞退",
  REJECTED: "見送り",
};

export function formatMonthlyRate(
  minimumYen: number | null,
  maximumYen: number | null,
) {
  if (minimumYen === null && maximumYen === null) return "未登録";

  const minimum = minimumYen === null ? null : formatManYen(minimumYen);
  const maximum = maximumYen === null ? null : formatManYen(maximumYen);

  if (minimum !== null && maximum !== null) {
    return minimum === maximum
      ? `${minimum}万円`
      : `${minimum}〜${maximum}万円`;
  }
  return minimum !== null ? `${minimum}万円〜` : `〜${maximum}万円`;
}

export function formatLocation({
  prefecture,
  city,
  nearestStation,
}: {
  prefecture: string | null;
  city: string | null;
  nearestStation: string | null;
}) {
  const area = [prefecture, city].filter(Boolean).join("");
  if (area && nearestStation) return `${area}（${nearestStation}）`;
  return area || nearestStation || "未登録";
}

export function formatStatusUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatManYen(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: 2,
  }).format(value / 10_000);
}
