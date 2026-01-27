"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createAdminSupabaseClient, createServerSupabaseClient } from "../../lib/supabase/server";
import { extractPdfPages } from "../../lib/pdf/extract";
import { chunkText } from "../../lib/pdf/chunk";
import { embedText } from "../../lib/ai/local";

export type UploadState = {
  error?: string;
  documentId?: string;
};

type StatusUpdate = {
  processing_status?: string;
  processing_stage?: string | null;
  processing_error?: string | null;
  processed_at?: string | null;
  page_count?: number;
};

async function updateDocumentStatus(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  documentId: string,
  update: StatusUpdate
) {
  await admin.from("documents").update(update).eq("id", documentId);
}

export async function uploadDocument(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const file = formData.get("file");
  const title = formData.get("title");

  if (!(file instanceof File)) {
    return { error: "Please choose a PDF file to upload." };
  }

  if (typeof title !== "string" || !title.trim()) {
    return { error: "Please provide a document title." };
  }

  if (file.type !== "application/pdf") {
    return { error: "Only PDF files are supported." };
  }

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "You must be signed in to upload." };
  }

  const userId = userData.user.id;
  const documentId = randomUUID();
  const storagePath = `${userId}/${documentId}.pdf`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("pdfs")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: documentInsert, error: documentError } = await admin
    .from("documents")
    .insert({
      id: documentId,
      user_id: userId,
      title: title.trim(),
      file_path: storagePath,
      page_count: 0,
      processing_status: "processing",
      processing_stage: "uploaded",
    })
    .select("id")
    .single();

  if (documentError || !documentInsert) {
    return { error: documentError?.message ?? "Failed to create document." };
  }

  try {
    await updateDocumentStatus(admin, documentId, {
      processing_stage: "extracting",
      processing_error: null,
    });

    const extracted = await extractPdfPages(buffer);

    await updateDocumentStatus(admin, documentId, {
      processing_stage: "saving-pages",
    });

    const pagesPayload = extracted.pages.map((text, index) => ({
      document_id: documentId,
      page_number: index + 1,
      text,
    }));

    if (pagesPayload.length > 0) {
      const { error: pagesError } = await admin
        .from("document_pages")
        .insert(pagesPayload);

      if (pagesError) {
        throw new Error(pagesError.message);
      }
    }

    await updateDocumentStatus(admin, documentId, {
      page_count: extracted.pageCount,
      processing_stage: "embedding",
    });

    const chunksPayload: {
      document_id: string;
      page_number: number;
      content: string;
      embedding: number[];
    }[] = [];

    for (let i = 0; i < extracted.pages.length; i += 1) {
      const pageText = extracted.pages[i];
      const pageChunks = chunkText(pageText);

      for (const chunk of pageChunks) {
        const embedding = await embedText(chunk);
        chunksPayload.push({
          document_id: documentId,
          page_number: i + 1,
          content: chunk,
          embedding,
        });
      }
    }

    if (chunksPayload.length > 0) {
      const { error: chunksError } = await admin
        .from("chunks")
        .insert(chunksPayload);

      if (chunksError) {
        throw new Error(chunksError.message);
      }
    }

    await updateDocumentStatus(admin, documentId, {
      processing_status: "ready",
      processing_stage: null,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    await updateDocumentStatus(admin, documentId, {
      processing_status: "error",
      processing_stage: null,
      processing_error:
        error instanceof Error ? error.message : "Processing failed.",
    });
    return { error: error instanceof Error ? error.message : "Processing failed." };
  }

  revalidatePath("/dashboard");

  return { documentId };
}

export async function reprocessDocument(
  _prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const docId = formData.get("docId");
  if (typeof docId !== "string" || !docId) {
    return { error: "Missing document id." };
  }

  const supabase = await createServerSupabaseClient();
  const admin = createAdminSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { error: "You must be signed in to reprocess." };
  }

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id,file_path")
    .eq("id", docId)
    .single();

  if (docError || !document) {
    return { error: docError?.message ?? "Document not found." };
  }

  await updateDocumentStatus(admin, docId, {
    processing_status: "processing",
    processing_stage: "reprocessing",
    processing_error: null,
  });

  const { data: downloadData, error: downloadError } = await admin.storage
    .from("pdfs")
    .download(document.file_path);

  if (downloadError || !downloadData) {
    await updateDocumentStatus(admin, docId, {
      processing_status: "error",
      processing_error: downloadError?.message ?? "Download failed.",
    });
    return { error: downloadError?.message ?? "Download failed." };
  }

  const buffer = Buffer.from(await downloadData.arrayBuffer());

  try {
    await admin.from("document_pages").delete().eq("document_id", docId);
    await admin.from("chunks").delete().eq("document_id", docId);
    await admin.from("flashcards").delete().eq("document_id", docId);
    await admin.from("glossary_terms").delete().eq("document_id", docId);

    await updateDocumentStatus(admin, docId, {
      processing_stage: "extracting",
    });

    const extracted = await extractPdfPages(buffer);

    await updateDocumentStatus(admin, docId, {
      processing_stage: "saving-pages",
    });

    const pagesPayload = extracted.pages.map((text, index) => ({
      document_id: docId,
      page_number: index + 1,
      text,
    }));

    if (pagesPayload.length > 0) {
      const { error: pagesError } = await admin
        .from("document_pages")
        .insert(pagesPayload);

      if (pagesError) {
        throw new Error(pagesError.message);
      }
    }

    await updateDocumentStatus(admin, docId, {
      page_count: extracted.pageCount,
      processing_stage: "embedding",
    });

    const chunksPayload: {
      document_id: string;
      page_number: number;
      content: string;
      embedding: number[];
    }[] = [];

    for (let i = 0; i < extracted.pages.length; i += 1) {
      const pageText = extracted.pages[i];
      const pageChunks = chunkText(pageText);

      for (const chunk of pageChunks) {
        const embedding = await embedText(chunk);
        chunksPayload.push({
          document_id: docId,
          page_number: i + 1,
          content: chunk,
          embedding,
        });
      }
    }

    if (chunksPayload.length > 0) {
      const { error: chunksError } = await admin
        .from("chunks")
        .insert(chunksPayload);

      if (chunksError) {
        throw new Error(chunksError.message);
      }
    }

    await updateDocumentStatus(admin, docId, {
      processing_status: "ready",
      processing_stage: null,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    await updateDocumentStatus(admin, docId, {
      processing_status: "error",
      processing_stage: null,
      processing_error:
        error instanceof Error ? error.message : "Reprocess failed.",
    });
    return { error: error instanceof Error ? error.message : "Reprocess failed." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/docs/${docId}`);

  return { documentId: docId };
}
