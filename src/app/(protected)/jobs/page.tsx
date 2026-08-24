import { AppHeader } from "@/components/layout/app-header";

export default function JobsPage() {
  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content">
        <h1>案件一覧</h1>
        <div className="empty-state">
          <p>登録された案件はありません。</p>
        </div>
      </section>
    </main>
  );
}
