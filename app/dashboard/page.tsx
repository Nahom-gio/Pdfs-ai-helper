import UploadForm from "../../components/UploadForm";
import SignOutButton from "../../components/SignOutButton";
import { createServerSupabaseClient } from "../../lib/supabase/server";
import { reprocessDocument, uploadDocument } from "../../server/actions/documents";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/sign-in");
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id,title,page_count,created_at,processing_status,processing_stage,processing_error")
    .order("created_at", { ascending: false });

  return (
    <div className="page">
      <div className="container">
        <nav className="nav">
          <div className="brand">Your documents</div>
          <SignOutButton />
        </nav>
        <div className="stack" style={{ marginTop: 24 }}>
          <UploadForm action={uploadDocument} />
          <div className="panel soft stack">
            <div>
              <div className="section-title">Recent Uploads</div>
              <div className="divider" />
            </div>
            {error ? (
              <p style={{ color: "#8a1f11" }}>{error.message}</p>
            ) : null}
            {documents && documents.length > 0 ? (
              <div className="card-list">
                {documents.map((doc) => (
                  <div key={doc.id} className="doc-card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        alignItems: "center",
                      }}
                    >
                      <div className="meta">
                        <a className="link" href={`/docs/${doc.id}`}>
                          <strong>{doc.title}</strong>
                        </a>
                        <span className="muted">{doc.page_count} pages</span>
                        <span className="muted">
                          Status: {doc.processing_status}
                          {doc.processing_stage ? ` (${doc.processing_stage})` : ""}
                        </span>
                        {doc.processing_error ? (
                          <span style={{ color: "#8a1f11" }}>
                            {doc.processing_error}
                          </span>
                        ) : null}
                      </div>
                      <div className="actions">
                        <span className="muted">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                        <form action={reprocessDocument}>
                          <input type="hidden" name="docId" value={doc.id} />
                          <button className="button secondary" type="submit">
                            Reprocess
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No documents yet. Upload your first PDF.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
