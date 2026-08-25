import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { JobForm } from "@/components/jobs/job-form";
import { AppHeader } from "@/components/layout/app-header";
import { listAgentCompanies } from "@/features/agent-companies/queries";
import { PREFECTURES, type JobFormValues } from "@/features/jobs/input";
import { getJobDetail } from "@/features/jobs/queries";

const jobIdSchema = z.uuid();

type PageProps = { params: Promise<{ jobId: string }> };

export default async function JobEditPage({ params }: PageProps) {
  const { jobId } = await params;
  if (!jobIdSchema.safeParse(jobId).success) notFound();

  const [job, companyPage] = await Promise.all([
    getJobDetail(jobId),
    listAgentCompanies({ page: 1, pageSize: 100 }),
  ]);
  if (!job) notFound();

  const companies = companyPage.items.map(({ id, companyName }) => ({
    id,
    companyName,
  }));
  if (!companies.some(({ id }) => id === job.agentCompany.id)) {
    companies.push(job.agentCompany);
  }

  const initialValues: JobFormValues = {
    jobName: job.jobName,
    agentCompanyId: job.agentCompany.id,
    companyName: job.companyName ?? "",
    commercialFlow: job.commercialFlow ?? "",
    monthlyRateMinManYen: toManYen(job.monthlyRateMinYen),
    monthlyRateMaxManYen: toManYen(job.monthlyRateMaxYen),
    workStyle: job.workStyle,
    workStyleNotes: job.workStyleNotes ?? "",
    prefecture: isPrefecture(job.prefecture) ? job.prefecture : "",
    city: job.city ?? "",
    nearestStation: job.nearestStation ?? "",
    locationNotes: job.locationNotes ?? "",
    utilizationPercent: job.utilizationPercent?.toString() ?? "",
    technologies: job.technologies.join("\n"),
    processPhases: job.processPhases.join("\n"),
    requiredConditions: job.requiredConditions ?? "",
    preferredConditions: job.preferredConditions ?? "",
  };

  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content job-page">
        <div className="desktop-edit-content">
          <Link className="back-link" href={`/jobs/${jobId}`}>
            ‹ 案件詳細
          </Link>
          <h1>案件編集</h1>
          <JobForm
            mode="edit"
            jobId={jobId}
            initialValues={initialValues}
            companies={companies}
          />
        </div>

        <div className="mobile-edit-unavailable">
          <h1>案件編集</h1>
          <div className="state-panel">
            <h2>編集はデスクトップで利用できます</h2>
            <p>
              スマートフォンでは案件の閲覧と応募ステータス更新を利用できます。
            </p>
            <Link className="secondary-link" href={`/jobs/${jobId}`}>
              案件詳細へ戻る
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function toManYen(value: number | null) {
  return value === null ? "" : (value / 10_000).toString();
}

function isPrefecture(
  value: string | null,
): value is (typeof PREFECTURES)[number] {
  return PREFECTURES.some((prefecture) => prefecture === value);
}
