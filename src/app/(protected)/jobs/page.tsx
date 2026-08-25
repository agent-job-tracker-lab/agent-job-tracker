import Link from "next/link";

import { AppHeader } from "@/components/layout/app-header";
import {
  APPLICATION_STATUS_LABELS,
  formatLocation,
  formatMonthlyRate,
  WORK_STYLE_LABELS,
} from "@/features/jobs/presentation";
import { listJobs } from "@/features/jobs/queries";
import { parsePagination } from "@/lib/api/pagination";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JobsPage({ searchParams }: PageProps) {
  const params = toUrlSearchParams(await searchParams);
  const pagination = parsePagination(params);

  return (
    <main className="protected-page">
      <AppHeader active="jobs" />
      <section className="page-content job-page">
        <div className="page-heading-row">
          <h1>案件一覧</h1>
          <Link className="primary-link desktop-create-link" href="/jobs/new">
            案件を登録
          </Link>
        </div>
        {!pagination.success ? (
          <div className="state-panel state-panel-error" role="alert">
            <h2>一覧を表示できません</h2>
            <p>{pagination.error.message}</p>
            <Link className="secondary-link" href="/jobs">
              最初のページを表示
            </Link>
          </div>
        ) : (
          <JobListContent
            page={pagination.data.page}
            pageSize={pagination.data.pageSize}
          />
        )}
      </section>
    </main>
  );
}

async function JobListContent({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  const result = await listJobs({ page, pageSize });

  if (result.items.length === 0) {
    const isPastLastPage = result.pageInfo.totalCount > 0;
    return (
      <div className="state-panel job-empty-state">
        <h2>
          {isPastLastPage
            ? "このページに案件はありません"
            : "案件はまだ登録されていません"}
        </h2>
        <p>
          {isPastLastPage
            ? "ページ番号を確認して、一覧へ戻ってください。"
            : "登録された案件と現在の応募ステータスがここに表示されます。"}
        </p>
        {isPastLastPage ? (
          <Link className="secondary-link" href="/jobs">
            最初のページを表示
          </Link>
        ) : (
          <Link className="primary-link desktop-create-link" href="/jobs/new">
            案件を登録
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="desktop-job-list">
        <table>
          <caption className="sr-only">
            登録済み案件と現在の応募ステータス。作成日時の新しい順。
          </caption>
          <thead>
            <tr>
              <th scope="col">案件名</th>
              <th scope="col">企業名</th>
              <th scope="col">紹介元</th>
              <th scope="col">現在ステータス</th>
              <th scope="col">働き方</th>
              <th scope="col">勤務地</th>
              <th scope="col">単価</th>
              <th scope="col">操作</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((job) => (
              <tr key={job.id}>
                <td>{job.jobName}</td>
                <td>{job.companyName ?? "未登録"}</td>
                <td>{job.agentCompany.companyName}</td>
                <td>
                  <span className="status-badge">
                    {APPLICATION_STATUS_LABELS[job.application.status]}
                  </span>
                </td>
                <td>{WORK_STYLE_LABELS[job.workStyle]}</td>
                <td>{formatLocation(job)}</td>
                <td>
                  {formatMonthlyRate(
                    job.monthlyRateMinYen,
                    job.monthlyRateMaxYen,
                  )}
                </td>
                <td>
                  <Link
                    aria-label={`${job.jobName}の詳細`}
                    href={`/jobs/${job.id}`}
                  >
                    詳細 ›
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-job-list">
        {result.items.map((job) => (
          <Link
            aria-label={`${job.jobName}の詳細`}
            className="job-card"
            href={`/jobs/${job.id}`}
            key={job.id}
          >
            <span className="job-card-content">
              <strong>{job.jobName}</strong>
              <span>
                {job.companyName ?? "企業名未登録"} ／{" "}
                {job.agentCompany.companyName}
              </span>
              <span>
                {APPLICATION_STATUS_LABELS[job.application.status]} ｜{" "}
                {WORK_STYLE_LABELS[job.workStyle]} ｜ {formatLocation(job)}
              </span>
              <span>
                単価：
                {formatMonthlyRate(
                  job.monthlyRateMinYen,
                  job.monthlyRateMaxYen,
                )}
              </span>
            </span>
            <span className="job-card-arrow" aria-hidden="true">
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
  if (totalPages <= 1) return <p className="result-count">全{totalCount}件</p>;

  const pageHref = (target: number) =>
    `/jobs?page=${target}&pageSize=${pageSize}`;
  return (
    <nav className="pagination" aria-label="案件一覧のページ">
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
