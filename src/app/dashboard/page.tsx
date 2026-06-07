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

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Shared Space</h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {name}
            </p>
          </div>
          <form action="/logout" method="post">
            <Button variant="outline" type="submit">
              Log out
            </Button>
          </form>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              Authentication is working. Next: create or join a workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button>Create workspace</Button>
            <Button variant="outline">Join workspace</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
