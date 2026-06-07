import Link from "next/link";
import { createWorkspace } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">New workspace</CardTitle>
          <CardDescription>Create a space to share with others</CardDescription>
        </CardHeader>
        <CardContent>
          {params.error && (
            <p className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-700">
              {params.error}
            </p>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input id="name" name="name" type="text" required autoFocus />
            </div>
            <Button formAction={createWorkspace} className="w-full">
              Create workspace
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/dashboard" className="underline">
              Back to dashboard
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
