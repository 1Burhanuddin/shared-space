import Link from "next/link";
import { joinWorkspace } from "../actions";
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

export default async function JoinWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Join workspace</CardTitle>
          <CardDescription>
            Enter the code shared with you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.error && (
            <p className="mb-4 rounded-md bg-red-50 p-2 text-sm text-red-700">
              {params.error}
            </p>
          )}
          <form action={joinWorkspace} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="code">Join code</Label>
              <Input
                id="code"
                name="code"
                placeholder="ABC123"
                className="uppercase tracking-widest"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Join
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
