import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import NotesBoard, { type Note } from "@/components/notes/notes-board";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, join_code")
    .eq("id", id)
    .maybeSingle();

  if (!workspace) notFound();

  const { count: memberCount } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", id);

  const { data: notesData } = await supabase
    .from("notes")
    .select("id, title, content, color")
    .eq("workspace_id", id)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const notes = (notesData ?? []) as Note[];

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">
              {memberCount ?? 1} member{(memberCount ?? 1) === 1 ? "" : "s"}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invite someone</CardTitle>
            <CardDescription>
              Share this code so they can join this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="inline-flex rounded-md border bg-background px-4 py-2 text-2xl font-mono font-semibold tracking-widest">
              {workspace.join_code ?? "------"}
            </div>
          </CardContent>
        </Card>

        <NotesBoard workspaceId={id} initialNotes={notes} />
      </div>
    </div>
  );
}
