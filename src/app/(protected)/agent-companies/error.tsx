"use client";

import { AppHeader } from "@/components/layout/app-header";

export default function AgentCompaniesError({ reset }: { reset: () => void }) {
  return (
    <main className="protected-page">
      <AppHeader active="agent-companies" />
      <section className="page-content company-page">
        <h1>エージェント会社</h1>
        <div className="state-panel state-panel-error" role="alert">
          <h2>エージェント会社を取得できませんでした</h2>
          <p>時間をおいて、もう一度お試しください。</p>
          <button className="secondary-button" type="button" onClick={reset}>
            再読み込み
          </button>
        </div>
      </section>
    </main>
  );
}
