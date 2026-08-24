import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";

export default function AgentCompanyNotFound() {
  return (
    <main className="protected-page">
      <AppHeader active="agent-companies" />
      <section className="page-content company-page">
        <h1>エージェント会社が見つかりません</h1>
        <div className="state-panel">
          <p>指定されたエージェント会社は存在しないか、削除されています。</p>
          <Link className="secondary-link" href="/agent-companies">
            エージェント会社一覧へ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
