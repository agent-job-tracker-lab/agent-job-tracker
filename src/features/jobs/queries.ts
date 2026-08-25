import type { ApplicationStatus, WorkStyle } from "@/generated/prisma/client";
import type { Pagination } from "@/lib/api/pagination";
import { prisma } from "@/lib/db";

export type JobPageInfo = Pagination & {
  totalCount: number;
  totalPages: number;
};

export type JobApplicationSummary = {
  id: string;
  status: ApplicationStatus;
  statusUpdatedAt: string;
};

export type JobAgentCompanySummary = {
  id: string;
  companyName: string;
};

export type JobListItem = {
  id: string;
  jobName: string;
  companyName: string | null;
  workStyle: WorkStyle;
  prefecture: string | null;
  city: string | null;
  nearestStation: string | null;
  monthlyRateMinYen: number | null;
  monthlyRateMaxYen: number | null;
  agentCompany: JobAgentCompanySummary;
  application: JobApplicationSummary;
};

export type JobList = {
  items: JobListItem[];
  pageInfo: JobPageInfo;
};

export type JobDetail = JobListItem & {
  commercialFlow: string | null;
  workStyleNotes: string | null;
  locationNotes: string | null;
  utilizationPercent: number | null;
  technologies: string[];
  processPhases: string[];
  requiredConditions: string | null;
  preferredConditions: string | null;
};

export async function listJobs({
  page,
  pageSize,
}: Pagination): Promise<JobList> {
  const where = { deletedAt: null };
  const [totalCount, records] = await prisma.$transaction([
    prisma.job.count({ where }),
    prisma.job.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        jobName: true,
        companyName: true,
        workStyle: true,
        prefecture: true,
        city: true,
        nearestStation: true,
        monthlyRateMinYen: true,
        monthlyRateMaxYen: true,
        agentCompany: { select: { id: true, companyName: true } },
        application: {
          select: { id: true, currentStatus: true, statusUpdatedAt: true },
        },
      },
    }),
  ]);

  return {
    items: records.map(toJobListItem),
    pageInfo: {
      page,
      pageSize,
      totalCount,
      totalPages: totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize),
    },
  };
}

export async function getJobDetail(id: string): Promise<JobDetail | null> {
  const record = await prisma.job.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      jobName: true,
      companyName: true,
      commercialFlow: true,
      monthlyRateMinYen: true,
      monthlyRateMaxYen: true,
      workStyle: true,
      workStyleNotes: true,
      prefecture: true,
      city: true,
      nearestStation: true,
      locationNotes: true,
      utilizationPercent: true,
      technologies: true,
      processPhases: true,
      requiredConditions: true,
      preferredConditions: true,
      agentCompany: { select: { id: true, companyName: true } },
      application: {
        select: { id: true, currentStatus: true, statusUpdatedAt: true },
      },
    },
  });

  if (!record) return null;
  const item = toJobListItem(record);
  return {
    ...item,
    commercialFlow: record.commercialFlow,
    workStyleNotes: record.workStyleNotes,
    locationNotes: record.locationNotes,
    utilizationPercent:
      record.utilizationPercent === null
        ? null
        : Number(record.utilizationPercent),
    technologies: record.technologies,
    processPhases: record.processPhases,
    requiredConditions: record.requiredConditions,
    preferredConditions: record.preferredConditions,
  };
}

function toJobListItem(record: {
  id: string;
  jobName: string;
  companyName: string | null;
  workStyle: WorkStyle;
  prefecture: string | null;
  city: string | null;
  nearestStation: string | null;
  monthlyRateMinYen: number | null;
  monthlyRateMaxYen: number | null;
  agentCompany: JobAgentCompanySummary;
  application: {
    id: string;
    currentStatus: ApplicationStatus;
    statusUpdatedAt: Date;
  } | null;
}): JobListItem {
  if (!record.application) {
    throw new Error(`Job ${record.id} has no Application`);
  }

  const { application, ...job } = record;
  return {
    ...job,
    application: {
      id: application.id,
      status: application.currentStatus,
      statusUpdatedAt: application.statusUpdatedAt.toISOString(),
    },
  };
}
