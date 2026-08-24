import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import { parsePagination } from "@/features/agent-companies/pagination";
import {
  AGENT_COMPANY_STATUS_LABELS,
  listAgentCompanies,
} from "@/features/agent-companies/queries";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AgentCompanyListPage({
  searchParams,
}: PageProps) {
  const params = toUrlSearchParams(await searchParams);
  const pagination = parsePagination(params);

  return (
    <main className="protected-page">
      <AppHeader active="agent-companies" />
      <section className="page-content company-page">
        <h1>エージェント会社一覧</h1>
        {!pagination.success ? (
          <div className="state-panel state-panel-error" role="alert">
            <h2>一覧を表示できません</h2>
            <p>{pagination.error.message}</p>
            <Link className="secondary-link" href="/agent-companies">
              最初のページを表示
            </Link>
          </div>
        ) : (
          <AgentCompanyListContent
            page={pagination.data.page}
            pageSize={pagination.data.pageSize}
          />
        )}
      </section>
    </main>
  );
}

async function AgentCompanyListContent({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  const result = await listAgentCompanies({ page, pageSize });

  if (result.items.length === 0) {
    const isPastLastPage = result.pageInfo.totalCount > 0;
    return (
      <div className="state-panel company-empty-state">
        <h2>
          {isPastLastPage
            ? "このページにエージェント会社はありません"
            : "エージェント会社はまだ登録されていません"}
        </h2>
        <p>
          {isPastLastPage
            ? "ページ番号を確認して、一覧へ戻ってください。"
            : "登録されたエージェント会社がここに表示されます。"}
        </p>
        {isPastLastPage ? (
          <Link className="secondary-link" href="/agent-companies">
            最初のページを表示
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <div className="desktop-company-list">
        <table>
          <caption className="sr-only">
            登録済みエージェント会社。作成日時の新しい順。
          </caption>
          <thead>
            <tr>
              <th scope="col">会社名</th>
              <th scope="col">担当者</th>
              <th scope="col">関係状態</th>
              <th scope="col">最終連絡</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((company) => (
              <tr key={company.id}>
                <td>{company.companyName}</td>
                <td>{company.contactName ?? "未登録"}</td>
                <td>{AGENT_COMPANY_STATUS_LABELS[company.status]}</td>
                <td>{formatDisplayDate(company.lastContactDate)}</td>
                <td>
                  <Link
                    aria-label={`${company.companyName}の詳細`}
                    href={`/agent-companies/${company.id}`}
                  >
                    詳細 ›
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-company-list">
        {result.items.map((company) => (
          <Link
            aria-label={`${company.companyName}の詳細`}
            className="company-card"
            href={`/agent-companies/${company.id}`}
            key={company.id}
          >
            <span className="company-card-content">
              <strong>{company.companyName}</strong>
              <span>
                {company.contactName ?? "担当者未登録"} ｜ 関係状態：
                {AGENT_COMPANY_STATUS_LABELS[company.status]}
              </span>
              <span>
                最終連絡：{formatDisplayDate(company.lastContactDate)}
              </span>
            </span>
            <span className="company-card-arrow" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
        <p className="mobile-operation-notice">
          登録はデスクトップで利用できます
        </p>
      </div>

      <Pagination
        page={result.pageInfo.page}
        pageSize={result.pageInfo.pageSize}
        totalCount={result.pageInfo.totalCount}
        totalPages={result.pageInfo.totalPages}
      />
    </>
  );
}

function Pagination({
  page,
  pageSize,
  totalCount,
  totalPages,
}: {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return <p className="result-count">全{totalCount}件</p>;
  }

  const pageHref = (target: number) =>
    `/agent-companies?page=${target}&pageSize=${pageSize}`;

  return (
    <nav className="pagination" aria-label="エージェント会社一覧のページ">
      {page > 1 ? (
        <Link href={pageHref(page - 1)}>前のページ</Link>
      ) : (
        <span aria-disabled="true">前のページ</span>
      )}
      <span>
        {page} / {totalPages}ページ（全{totalCount}件）
      </span>
      {page < totalPages ? (
        <Link href={pageHref(page + 1)}>次のページ</Link>
      ) : (
        <span aria-disabled="true">次のページ</span>
      )}
    </nav>
  );
}

function toUrlSearchParams(
  source: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.append(key, value);
    }
  }
  return params;
}

function formatDisplayDate(date: string | null) {
  return date?.replaceAll("-", "/") ?? "未登録";
}
