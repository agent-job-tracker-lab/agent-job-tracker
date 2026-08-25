import { prisma } from "@/lib/db";

import type { AgentCompanyInput, UpdateAgentCompanyInput } from "./input";
import { getAgentCompanyDetail, type AgentCompanyDetail } from "./queries";

export async function createAgentCompany(
  input: AgentCompanyInput,
): Promise<AgentCompanyDetail> {
  const record = await prisma.agentCompany.create({
    data: {
      companyName: input.companyName,
      contactName: input.contactName,
      contactDetails: input.contactDetails,
      characteristics: input.characteristics,
      lastContactDate: input.lastContactDate
        ? new Date(`${input.lastContactDate}T00:00:00.000Z`)
        : null,
      status: input.status,
    },
    select: {
      id: true,
      companyName: true,
      contactName: true,
      contactDetails: true,
      characteristics: true,
      status: true,
      lastContactDate: true,
    },
  });

  return {
    ...record,
    lastContactDate: record.lastContactDate?.toISOString().slice(0, 10) ?? null,
    relatedJobs: [],
  };
}

export async function updateAgentCompany(
  id: string,
  input: UpdateAgentCompanyInput,
): Promise<AgentCompanyDetail | null> {
  const result = await prisma.agentCompany.updateMany({
    where: { id, deletedAt: null },
    data: {
      companyName: input.companyName,
      contactName: input.contactName,
      contactDetails: input.contactDetails,
      characteristics: input.characteristics,
      lastContactDate:
        input.lastContactDate === undefined
          ? undefined
          : input.lastContactDate
            ? new Date(`${input.lastContactDate}T00:00:00.000Z`)
            : null,
      status: input.status,
    },
  });

  if (result.count === 0) return null;
  return getAgentCompanyDetail(id);
}
