"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function generateJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  if (!name) {
    redirect("/workspace/new?error=Name is required");
  }

  let workspaceId: string | null = null;

  // Retry on rare join_code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const join_code = generateJoinCode();
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, join_code, owner_id: user.id })
      .select("id")
      .single();

    if (!error && data) {
      workspaceId = data.id;
      break;
    }
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      redirect(`/workspace/new?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (!workspaceId) {
    redirect("/workspace/new?error=Could not create workspace, try again");
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: user.id, role: "owner" });

  if (memberError) {
    redirect(`/workspace/new?error=${encodeURIComponent(memberError.message)}`);
  }

  revalidatePath("/dashboard");
  redirect(`/workspace/${workspaceId}`);
}

export async function joinWorkspace(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const code = String(formData.get("join_code") || "")
    .trim()
    .toUpperCase();
  if (!code) {
    redirect("/workspace/join?error=Enter a join code");
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("join_code", code)
    .maybeSingle();

  if (error || !workspace) {
    redirect("/workspace/join?error=No workspace found for that code");
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .upsert(
      { workspace_id: workspace.id, user_id: user.id, role: "member" },
      { onConflict: "workspace_id,user_id", ignoreDuplicates: true }
    );

  if (memberError) {
    redirect(`/workspace/join?error=${encodeURIComponent(memberError.message)}`);
  }

  revalidatePath("/dashboard");
  redirect(`/workspace/${workspace.id}`);
}
