"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function ensureProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, name: string) {
  await supabase
    .from("profiles")
    .upsert({ id: userId, name }, { onConflict: "id", ignoreDuplicates: true });
}

export async function createNote(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const workspaceId = String(formData.get("workspace_id") || "");
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const color = String(formData.get("color") || "yellow");
  if (!workspaceId) return;

  await ensureProfile(
    supabase,
    user.id,
    (user.user_metadata?.name as string) ?? user.email ?? "User"
  );

  await supabase.from("notes").insert({
    workspace_id: workspaceId,
    type: "note",
    title: title || null,
    content: content || null,
    color,
    created_by: user.id,
  });

  revalidatePath(`/workspace/${workspaceId}`);
}

export async function updateNote(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const workspaceId = String(formData.get("workspace_id") || "");
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const color = String(formData.get("color") || "yellow");
  if (!id) return;

  await supabase
    .from("notes")
    .update({
      title: title || null,
      content: content || null,
      color,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath(`/workspace/${workspaceId}`);
}

export async function deleteNote(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const workspaceId = String(formData.get("workspace_id") || "");
  if (!id) return;

  await supabase
    .from("notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath(`/workspace/${workspaceId}`);
}
