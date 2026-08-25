import type { AgentCompanyStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import type { Pagination } from "./pagination";

export type PageInfo = Pagination & {
  totalCount: number;
  totalPages: number;
};

export type AgentCompanyListItem = {
  id: string;
  companyName: string;
  contactName: string | null;
  status: AgentCompanyStatus;
  lastContactDate: string | null;
};

export type AgentCompanyList = {
  items: AgentCompanyListItem[];
  pageInfo: PageInfo;
};

export type RelatedJob = {
  id: string;
  jobName: string;
  companyName: string | null;
};

export type AgentCompanyDetail = AgentCompanyListItem & {
  contactDetails: string | null;
  characteristics: string | null;
  relatedJobs: RelatedJob[];
};

export async function listAgentCompanies({
  page,
  pageSize,
}: Pagination): Promise<AgentCompanyList> {
  const where = { deletedAt: null };
  const [totalCount, records] = await prisma.$transaction([
    prisma.agentCompany.count({ where }),
    prisma.agentCompany.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        companyName: true,
        contactName: true,
        status: true,
        lastContactDate: true,
      },
    }),
  ]);

  return {
    items: records.map((record) => ({
      ...record,
      lastContactDate: formatDate(record.lastContactDate),
    })),
    pageInfo: {
      page,
      pageSize,
      totalCount,
      totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
    },
  };
}

export async function getAgentCompanyDetail(
  id: string,
): Promise<AgentCompanyDetail | null> {
  const record = await prisma.agentCompany.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactDetails: true,
      characteristics: true,
      status: true,
      lastContactDate: true,
      jobs: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true, jobName: true, companyName: true },
      },
    },
  });

  if (!record) return null;

  const { jobs, ...company } = record;
  return {
    ...company,
    lastContactDate: formatDate(company.lastContactDate),
    relatedJobs: jobs,
  };
}

function formatDate(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

export const AGENT_COMPANY_STATUS_LABELS: Record<AgentCompanyStatus, string> = {
  ACTIVE: "積極対応中",
  ON_HOLD: "保留",
  ENDED: "終了",
};
