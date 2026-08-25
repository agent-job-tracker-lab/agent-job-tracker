import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import {
  AgentCompanyForm,
  type AgentCompanyFormValues,
} from "@/components/agent-companies/agent-company-form";
import { AppHeader } from "@/components/layout/app-header";
import { getAgentCompanyDetail } from "@/features/agent-companies/queries";

const agentCompanyIdSchema = z.uuid();

type PageProps = {
  params: Promise<{ agentCompanyId: string }>;
};

export default async function AgentCompanyEditPage({ params }: PageProps) {
  const { agentCompanyId } = await params;
  if (!agentCompanyIdSchema.safeParse(agentCompanyId).success) notFound();

  const company = await getAgentCompanyDetail(agentCompanyId);
  if (!company) notFound();

  const initialValues: AgentCompanyFormValues = {
    companyName: company.companyName,
    contactName: company.contactName ?? "",
    contactDetails: company.contactDetails ?? "",
    characteristics: company.characteristics ?? "",
    lastContactDate: company.lastContactDate ?? "",
    status: company.status,
  };

  return (
    <main className="protected-page">
      <AppHeader active="agent-companies" />
      <section className="page-content company-page">
        <div className="desktop-edit-content">
          <Link
            className="back-link"
            href={`/agent-companies/${agentCompanyId}`}
          >
            ‹ エージェント会社詳細
          </Link>
          <h1>エージェント会社編集</h1>
          <AgentCompanyForm
            mode="edit"
            companyId={agentCompanyId}
            initialValues={initialValues}
          />
        </div>

        <div className="mobile-edit-unavailable">
          <h1>エージェント会社編集</h1>
          <div className="state-panel">
            <h2>編集はデスクトップで利用できます</h2>
            <p>スマートフォンではエージェント会社の閲覧のみ利用できます。</p>
            <Link
              className="secondary-link"
              href={`/agent-companies/${agentCompanyId}`}
            >
              エージェント会社詳細へ戻る
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
