import { prisma } from "@/lib/db";

import type { AgentCompanyInput } from "./input";
import type { AgentCompanyDetail } from "./queries";

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
