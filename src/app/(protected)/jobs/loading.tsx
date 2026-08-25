import { AppHeader } from "@/components/layout/app-header";

export default function JobsLoading() {
  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content job-page" aria-busy="true">
        <h1>案件</h1>
        <div className="loading-panel" role="status">
          <span className="loading-spinner" aria-hidden="true" />
          読み込み中です
        </div>
      </section>
    </main>
  );
}
