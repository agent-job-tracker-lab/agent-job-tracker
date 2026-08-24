import { LogoutButton } from "@/components/auth/logout-button";

export default function JobsPage() {
  return (
    <main className="protected-page">
      <header className="app-header">
        <span className="app-brand">Agent Job Tracker</span>
        <nav aria-label="メインナビゲーション">
          <span aria-current="page">案件管理</span>
          <span>エージェント会社管理</span>
        </nav>
        <LogoutButton />
      </header>
      <section className="page-content">
        <h1>案件一覧</h1>
        <div className="empty-state">
          <p>登録された案件はありません。</p>
        </div>
      </section>
    </main>
  );
}
