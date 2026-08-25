import Link from "next/link";

import { JobForm } from "@/components/jobs/job-form";
import { AppHeader } from "@/components/layout/app-header";
import { listAgentCompanies } from "@/features/agent-companies/queries";

export default async function JobCreatePage() {
  const companies = await listAgentCompanies({ page: 1, pageSize: 100 });

  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content job-page">
        <div className="desktop-create-content">
          <Link className="back-link" href="/jobs">
            ‹ 案件一覧
          </Link>
          <h1>案件登録</h1>
          {companies.items.length > 0 ? (
            <JobForm
              companies={companies.items.map(({ id, companyName }) => ({
                id,
                companyName,
              }))}
            />
          ) : (
            <div className="state-panel">
              <h2>紹介元エージェント会社が必要です</h2>
              <p>
                案件を登録する前に、紹介元エージェント会社を登録してください。
              </p>
              <Link className="primary-link" href="/agent-companies/new">
                エージェント会社を登録
              </Link>
            </div>
          )}
        </div>
        <div className="mobile-create-unavailable">
          <h1>案件登録</h1>
          <div className="state-panel">
            <h2>登録はデスクトップで利用できます</h2>
            <p>
              スマートフォンでは案件の閲覧と応募ステータス更新を利用できます。
            </p>
            <Link className="secondary-link" href="/jobs">
              案件一覧へ戻る
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
