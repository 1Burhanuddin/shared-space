import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const name =
    (user.user_metadata?.name as string | undefined) ?? user.email;

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(id, name)")
    .eq("user_id", user.id);

  type Row = { workspaces: { id: string; name: string } | null };
  const workspaces =
    (memberships as Row[] | null)
      ?.map((m) => m.workspaces)
      .filter((w): w is { id: string; name: string } => Boolean(w)) ?? [];

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Shared Space</h1>
            <p className="text-sm text-muted-foreground">Welcome, {name}</p>
          </div>
          <form action="/logout" method="post">
            <Button variant="outline" type="submit">
              Log out
            </Button>
          </form>
        </div>

        <div className="flex gap-3">
          <Link href="/workspace/new">
            <Button>Create workspace</Button>
          </Link>
          <Link href="/workspace/join">
            <Button variant="outline">Join workspace</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your workspaces</CardTitle>
            <CardDescription>
              {workspaces.length === 0
                ? "You're not in any workspace yet."
                : "Open a workspace to view it."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {workspaces.map((w) => (
              <Link
                key={w.id}
                href={`/workspace/${w.id}`}
                className="rounded-md border p-3 hover:bg-muted"
              >
                {w.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
