import { ExportPacketPanel } from "@/components/scholarships/export-packet-panel";

export default async function ScholarshipWorkspaceReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="shell">
      <div className="page-wrap">
        <section className="card hero-main">
          <p className="eyebrow">Final Review</p>
          <h1 className="hero-title" style={{ maxWidth: "12ch" }}>
            Review the final application packet.
          </h1>
          <p className="hero-copy">
            Use this page to catch missing pieces, save a clean snapshot, and
            export the version you actually want to submit.
          </p>
        </section>

        <ExportPacketPanel applicationId={id} />
      </div>
    </main>
  );
}
