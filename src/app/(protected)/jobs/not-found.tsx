import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";

export default function JobNotFound() {
  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content job-page">
        <h1>案件が見つかりません</h1>
        <div className="state-panel">
          <p>指定された案件は存在しないか、削除されています。</p>
          <Link className="secondary-link" href="/jobs">
            案件一覧へ戻る
          </Link>
        </div>
      </section>
    </main>
  );
}
