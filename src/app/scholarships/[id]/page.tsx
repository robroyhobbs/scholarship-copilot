import { ApplicationDetailPanel } from "@/components/scholarships/application-detail-panel";

export default async function ScholarshipWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="shell">
      <div className="page-wrap">
        <ApplicationDetailPanel applicationId={id} />
      </div>
    </main>
  );
}
