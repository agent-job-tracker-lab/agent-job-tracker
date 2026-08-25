import Link from "next/link";

import { AgentCompanyForm } from "@/components/agent-companies/agent-company-form";
import { AppHeader } from "@/components/layout/app-header";

export default function AgentCompanyCreatePage() {
  return (
    <main className="protected-page">
      <AppHeader active="agent-companies" />
      <section className="page-content company-page">
        <div className="desktop-create-content">
          <Link className="back-link" href="/agent-companies">
            ‹ エージェント会社一覧
          </Link>
          <h1>エージェント会社登録</h1>
          <AgentCompanyForm />
        </div>

        <div className="mobile-create-unavailable">
          <h1>エージェント会社登録</h1>
          <div className="state-panel">
            <h2>登録はデスクトップで利用できます</h2>
            <p>スマートフォンではエージェント会社の閲覧のみ利用できます。</p>
            <Link className="secondary-link" href="/agent-companies">
              エージェント会社一覧へ戻る
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
