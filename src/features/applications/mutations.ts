import type { ApplicationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import type { UpdateApplicationStatusInput } from "./input";

export class ApplicationJobUnavailableError extends Error {
  constructor() {
    super("Job is missing or deleted");
    this.name = "ApplicationJobUnavailableError";
  }
}

export class ApplicationUnavailableError extends Error {
  constructor() {
    super("Application is missing");
    this.name = "ApplicationUnavailableError";
  }
}

export class ApplicationStatusUnchangedError extends Error {
  constructor() {
    super("Application status is unchanged");
    this.name = "ApplicationStatusUnchangedError";
  }
}

export type UpdatedApplicationStatus = {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  statusUpdatedAt: string;
};

export async function updateApplicationStatus(
  jobId: string,
  input: UpdateApplicationStatusInput,
  actorUserId: string,
): Promise<UpdatedApplicationStatus> {
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
    if (!job || job.deleted_at !== null) {
      throw new ApplicationJobUnavailableError();
    }

    const applications = await transaction.$queryRaw<
      Array<{ id: string; current_status: ApplicationStatus }>
    >`
      SELECT id, current_status
      FROM applications
      WHERE job_id = ${jobId}::uuid
      FOR UPDATE
    `;
    const application = applications[0];
    if (!application) throw new ApplicationUnavailableError();
    if (application.current_status === input.status) {
      throw new ApplicationStatusUnchangedError();
    }

    const changedAt = new Date();
    const updated = await transaction.application.update({
      where: { id: application.id },
      data: {
        currentStatus: input.status,
        statusUpdatedAt: changedAt,
        updatedAt: changedAt,
      },
      select: { id: true, jobId: true, currentStatus: true },
    });
    await transaction.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        previousStatus: application.current_status,
        newStatus: input.status,
        changedAt,
        changedByUserId: actorUserId,
      },
    });

    return {
      id: updated.id,
      jobId: updated.jobId,
      status: updated.currentStatus,
      statusUpdatedAt: changedAt.toISOString(),
    };
  });
}
