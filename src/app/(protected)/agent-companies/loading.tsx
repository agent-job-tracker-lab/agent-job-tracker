import { AppHeader } from "@/components/layout/app-header";

export default function AgentCompaniesLoading() {
  return (
    <main className="protected-page">
      <AppHeader active="agent-companies" />
      <section className="page-content company-page" aria-busy="true">
        <h1>エージェント会社</h1>
        <div className="loading-panel" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          読み込み中です
        </div>
      </section>
    </main>
  );
}
