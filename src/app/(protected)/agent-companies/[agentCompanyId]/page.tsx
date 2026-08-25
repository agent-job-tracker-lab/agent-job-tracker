import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AppHeader } from "@/components/layout/app-header";
import {
  AGENT_COMPANY_STATUS_LABELS,
  getAgentCompanyDetail,
} from "@/features/agent-companies/queries";

const agentCompanyIdSchema = z.uuid();

type PageProps = {
  params: Promise<{ agentCompanyId: string }>;
};

export default async function AgentCompanyDetailPage({ params }: PageProps) {
  const { agentCompanyId } = await params;
  if (!agentCompanyIdSchema.safeParse(agentCompanyId).success) notFound();

  const company = await getAgentCompanyDetail(agentCompanyId);
  if (!company) notFound();

  return (
    <main className="protected-page">
      <AppHeader active="agent-companies" />
      <section className="page-content company-page">
        <div className="page-heading-row">
          <div>
            <Link className="back-link" href="/agent-companies">
              ‹ エージェント会社一覧
            </Link>
            <h1>エージェント会社詳細</h1>
          </div>
        </div>

        <div className="company-detail-grid">
          <DetailSection title="会社情報">
            <dl>
              <DescriptionItem label="会社名" value={company.companyName} />
              <DescriptionItem
                label="特徴"
                value={company.characteristics ?? "未登録"}
              />
            </dl>
          </DetailSection>

          <DetailSection title="連絡先">
            <dl>
              <DescriptionItem
                label="担当者"
                value={company.contactName ?? "未登録"}
              />
              <DescriptionItem
                label="連絡先"
                value={company.contactDetails ?? "未登録"}
              />
            </dl>
          </DetailSection>

          <DetailSection title="関係情報">
            <dl>
              <DescriptionItem
                label="関係状態"
                value={AGENT_COMPANY_STATUS_LABELS[company.status]}
              />
              <DescriptionItem
                label="最終連絡"
                value={formatDisplayDate(company.lastContactDate)}
              />
            </dl>
          </DetailSection>

          <DetailSection title="関連案件">
            {company.relatedJobs.length > 0 ? (
              <ul className="related-job-list">
                {company.relatedJobs.map((job) => (
                  <li key={job.id}>
                    <Link href={`/jobs/${job.id}`}>
                      {job.jobName}
                      {job.companyName ? `（${job.companyName}）` : ""} ›
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-text">関連する案件はありません。</p>
            )}
          </DetailSection>
        </div>

        <p className="mobile-operation-notice detail-mobile-notice">
          編集・削除はデスクトップで利用できます
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

function DescriptionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="description-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDisplayDate(date: string | null) {
  return date?.replaceAll("-", "/") ?? "未登録";
}
