import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AppHeader } from "@/components/layout/app-header";
import {
  APPLICATION_STATUS_LABELS,
  formatLocation,
  formatMonthlyRate,
  formatStatusUpdatedAt,
  WORK_STYLE_LABELS,
} from "@/features/jobs/presentation";
import { getJobDetail } from "@/features/jobs/queries";

const jobIdSchema = z.uuid();

type PageProps = { params: Promise<{ jobId: string }> };

export default async function JobDetailPage({ params }: PageProps) {
  const { jobId } = await params;
  if (!jobIdSchema.safeParse(jobId).success) notFound();

  const job = await getJobDetail(jobId);
  if (!job) notFound();

  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content job-page">
        <Link className="back-link" href="/jobs">
          ‹ 案件一覧
        </Link>
        <h1>案件詳細</h1>

        <div className="job-detail-grid">
          <DetailSection title="基本情報">
            <dl>
              <DescriptionItem label="案件名" value={job.jobName} />
              <DescriptionItem
                label="企業名"
                value={job.companyName ?? "未登録"}
              />
              <DescriptionItem label="紹介元">
                <Link href={`/agent-companies/${job.agentCompany.id}`}>
                  {job.agentCompany.companyName} ›
                </Link>
              </DescriptionItem>
              <DescriptionItem
                label="商流"
                value={job.commercialFlow ?? "未登録"}
              />
            </dl>
          </DetailSection>

          <DetailSection title="勤務条件">
            <dl>
              <DescriptionItem
                label="働き方"
                value={WORK_STYLE_LABELS[job.workStyle]}
              />
              <DescriptionItem
                label="働き方補足"
                value={job.workStyleNotes ?? "未登録"}
              />
              <DescriptionItem label="勤務地" value={formatLocation(job)} />
              <DescriptionItem
                label="勤務地補足"
                value={job.locationNotes ?? "未登録"}
              />
              <DescriptionItem
                label="単価"
                value={formatMonthlyRate(
                  job.monthlyRateMinYen,
                  job.monthlyRateMaxYen,
                )}
              />
              <DescriptionItem
                label="稼働率"
                value={
                  job.utilizationPercent === null
                    ? "未登録"
                    : `${job.utilizationPercent}%`
                }
              />
            </dl>
          </DetailSection>

          <DetailSection title="業務・スキル">
            <dl>
              <DescriptionItem
                label="技術"
                value={formatList(job.technologies)}
              />
              <DescriptionItem
                label="担当工程"
                value={formatList(job.processPhases)}
              />
              <DescriptionItem
                label="必須条件"
                value={job.requiredConditions ?? "未登録"}
              />
              <DescriptionItem
                label="歓迎条件"
                value={job.preferredConditions ?? "未登録"}
              />
            </dl>
          </DetailSection>

          <DetailSection title="応募状況">
            <dl>
              <DescriptionItem
                label="現在ステータス"
                value={APPLICATION_STATUS_LABELS[job.application.status]}
              />
              <DescriptionItem
                label="ステータス更新日時"
                value={formatStatusUpdatedAt(job.application.statusUpdatedAt)}
              />
            </dl>
          </DetailSection>
        </div>

        <p className="mobile-operation-notice detail-mobile-notice">
          登録・編集・削除はデスクトップで利用できます
        </p>
      </section>
    </main>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="detail-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function DescriptionItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="description-item">
      <dt>{label}</dt>
      <dd>{children ?? value}</dd>
    </div>
  );
}

function formatList(values: string[]) {
  return values.length > 0 ? values.join("、") : "未登録";
}
