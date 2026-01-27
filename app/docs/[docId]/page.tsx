import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import DocReader from "../../../components/DocReader";
import { chatWithDocument } from "../../../server/actions/chat";
import { generateSummaries } from "../../../server/actions/summaries";
import { generateFlashcards } from "../../../server/actions/flashcards";
import { generateGlossary } from "../../../server/actions/glossary";
import { askSelectedText } from "../../../server/actions/selection";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/sign-in");
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id,title,page_count,created_at,summary,file_path")
    .eq("id", docId)
    .single();

  if (!document) {
    notFound();
  }

  const { data: pages } = await supabase
    .from("document_pages")
    .select("id,page_number,text,summary")
    .eq("document_id", docId)
    .order("page_number", { ascending: true });

  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("id,front,back,source_page")
    .eq("document_id", docId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: glossary } = await supabase
    .from("glossary_terms")
    .select("id,term,definition,source_page")
    .eq("document_id", docId)
    .order("created_at", { ascending: false })
    .limit(30);

  let pdfUrl: string | null = null;
  if (document.file_path) {
    const { data: signed } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(document.file_path, 60 * 60);
    pdfUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="page">
      <div className="container">
        <nav className="nav">
          <div className="brand">{document.title}</div>
          <a className="link" href="/dashboard">
            Back to dashboard
          </a>
        </nav>
        <DocReader
          docId={docId}
          pdfUrl={pdfUrl}
          document={document}
          pages={pages ?? []}
          flashcards={flashcards ?? []}
          glossary={glossary ?? []}
          chatAction={chatWithDocument}
          summaryAction={generateSummaries}
          flashcardAction={generateFlashcards}
          glossaryAction={generateGlossary}
          askSelectionAction={askSelectedText}
        />
      </div>
    </div>
  );
}
