import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";

type AppHeaderProps = {
  active: "jobs" | "agent-companies";
};

export function AppHeader({ active }: AppHeaderProps) {
  const navigation = (
    <>
      <Link href="/jobs" aria-current={active === "jobs" ? "page" : undefined}>
        案件管理
      </Link>
      <Link
        href="/agent-companies"
        aria-current={active === "agent-companies" ? "page" : undefined}
      >
        エージェント会社管理
      </Link>
    </>
  );

  return (
    <header className="app-header">
      <Link
        className="app-brand"
        href={active === "jobs" ? "/jobs" : "/agent-companies"}
      >
        Agent Job Tracker
      </Link>
      <nav className="desktop-navigation" aria-label="メインナビゲーション">
        {navigation}
      </nav>
      <div className="desktop-logout">
        <LogoutButton />
      </div>
      <details className="mobile-menu">
        <summary aria-label="メニューを開く">☰</summary>
        <nav aria-label="モバイルナビゲーション">{navigation}</nav>
        <LogoutButton />
      </details>
    </header>
  );
}
