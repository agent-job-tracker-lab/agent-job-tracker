import { prisma } from "@/lib/db";

import type { CreateJobInput } from "./input";
import type { JobDetail } from "./queries";

export class AgentCompanyUnavailableError extends Error {
  constructor() {
    super("AgentCompany is missing or deleted");
    this.name = "AgentCompanyUnavailableError";
  }
}

export class JobUnavailableError extends Error {
  constructor() {
    super("Job is missing or deleted");
    this.name = "JobUnavailableError";
  }
}

export async function createJobWithApplication(
  input: CreateJobInput,
): Promise<JobDetail> {
  return prisma.$transaction(async (transaction) => {
    const companies = await transaction.$queryRaw<
      Array<{ id: string; deleted_at: Date | null }>
    >`
      SELECT id, deleted_at
      FROM agent_companies
      WHERE id = ${input.agentCompanyId}::uuid
      FOR UPDATE
    `;
    const company = companies[0];
    if (!company || company.deleted_at !== null) {
      throw new AgentCompanyUnavailableError();
    }

    const record = await transaction.job.create({
      data: {
        agentCompanyId: input.agentCompanyId,
        jobName: input.jobName,
        companyName: input.companyName,
        commercialFlow: input.commercialFlow,
        monthlyRateMinYen: input.monthlyRateMinYen,
        monthlyRateMaxYen: input.monthlyRateMaxYen,
        workStyle: input.workStyle,
        workStyleNotes: input.workStyleNotes,
        prefecture: input.prefecture,
        city: input.city,
        nearestStation: input.nearestStation,
        locationNotes: input.locationNotes,
        utilizationPercent: input.utilizationPercent,
        technologies: input.technologies,
        processPhases: input.processPhases,
        requiredConditions: input.requiredConditions,
        preferredConditions: input.preferredConditions,
        application: { create: { currentStatus: "NOT_APPLIED" } },
      },
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

    if (!record.application) {
      throw new Error("Application creation did not return a record");
    }

    const { application, ...job } = record;
    return {
      ...job,
      utilizationPercent:
        job.utilizationPercent === null ? null : Number(job.utilizationPercent),
      application: {
        id: application.id,
        status: application.currentStatus,
        statusUpdatedAt: application.statusUpdatedAt.toISOString(),
      },
    };
  });
}

export async function updateJob(
  jobId: string,
  input: CreateJobInput,
): Promise<JobDetail> {
  return prisma.$transaction(async (transaction) => {
    const jobs = await transaction.$queryRaw<
      Array<{ id: string; deleted_at: Date | null }>
    >`
      SELECT id, deleted_at
      FROM jobs
      WHERE id = ${jobId}::uuid
      FOR UPDATE
    `;
    const job = jobs[0];
    if (!job || job.deleted_at !== null) throw new JobUnavailableError();

    const companies = await transaction.$queryRaw<
      Array<{ id: string; deleted_at: Date | null }>
    >`
      SELECT id, deleted_at
      FROM agent_companies
      WHERE id = ${input.agentCompanyId}::uuid
      FOR UPDATE
    `;
    const company = companies[0];
    if (!company || company.deleted_at !== null) {
      throw new AgentCompanyUnavailableError();
    }

    const record = await transaction.job.update({
      where: { id: jobId },
      data: {
        agentCompanyId: input.agentCompanyId,
        jobName: input.jobName,
        companyName: input.companyName,
        commercialFlow: input.commercialFlow,
        monthlyRateMinYen: input.monthlyRateMinYen,
        monthlyRateMaxYen: input.monthlyRateMaxYen,
        workStyle: input.workStyle,
        workStyleNotes: input.workStyleNotes,
        prefecture: input.prefecture,
        city: input.city,
        nearestStation: input.nearestStation,
        locationNotes: input.locationNotes,
        utilizationPercent: input.utilizationPercent,
        technologies: input.technologies,
        processPhases: input.processPhases,
        requiredConditions: input.requiredConditions,
        preferredConditions: input.preferredConditions,
      },
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

    if (!record.application) {
      throw new Error("Updated Job has no Application");
    }

    const { application, ...updatedJob } = record;
    return {
      ...updatedJob,
      utilizationPercent:
        updatedJob.utilizationPercent === null
          ? null
          : Number(updatedJob.utilizationPercent),
      application: {
        id: application.id,
        status: application.currentStatus,
        statusUpdatedAt: application.statusUpdatedAt.toISOString(),
      },
    };
  });
}
