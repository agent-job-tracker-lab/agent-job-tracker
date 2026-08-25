"use client";

import { AppHeader } from "@/components/layout/app-header";

export default function JobsError({ reset }: { reset: () => void }) {
  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content job-page">
        <h1>案件</h1>
        <div className="state-panel state-panel-error" role="alert">
          <h2>案件を取得できませんでした</h2>
          <p>時間をおいて、もう一度お試しください。</p>
          <button className="secondary-button" type="button" onClick={reset}>
            再読み込み
          </button>
        </div>
      </section>
    </main>
  );
}
