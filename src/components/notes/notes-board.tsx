"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createNote, updateNote, deleteNote } from "@/app/workspace/notes-actions";

export type Note = {
  id: string;
  title: string | null;
  content: string | null;
  color: string;
};

const COLORS: { key: string; bg: string; ring: string }[] = [
  { key: "yellow", bg: "bg-yellow-100", ring: "ring-yellow-400" },
  { key: "pink", bg: "bg-pink-100", ring: "ring-pink-400" },
  { key: "blue", bg: "bg-blue-100", ring: "ring-blue-400" },
  { key: "green", bg: "bg-green-100", ring: "ring-green-400" },
  { key: "purple", bg: "bg-purple-100", ring: "ring-purple-400" },
];

function bgFor(color: string) {
  return COLORS.find((c) => c.key === color)?.bg ?? "bg-yellow-100";
}

function ColorPicker({ name, value }: { name: string; value: string }) {
  const [selected, setSelected] = useState(value);
  return (
    <div className="flex gap-2">
      <input type="hidden" name={name} value={selected} />
      {COLORS.map((c) => (
        <button
          key={c.key}
          type="button"
          aria-label={c.key}
          onClick={() => setSelected(c.key)}
          className={`h-8 w-8 rounded-full ${c.bg} ring-2 ${
            selected === c.key ? c.ring : "ring-transparent"
          }`}
        />
      ))}
    </div>
  );
}

function NoteCard({ note, workspaceId }: { note: Note; workspaceId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={`flex w-full flex-col gap-1 rounded-lg p-3 text-left shadow-sm ${bgFor(
          note.color
        )}`}
      >
        {note.title && <span className="font-medium">{note.title}</span>}
        {note.content && (
          <span className="whitespace-pre-wrap text-sm text-gray-700">
            {note.content}
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit note</DialogTitle>
        </DialogHeader>
        <form action={updateNote} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={note.id} />
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor={`title-${note.id}`}>Title</Label>
            <Input id={`title-${note.id}`} name="title" defaultValue={note.title ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`content-${note.id}`}>Content</Label>
            <Textarea
              id={`content-${note.id}`}
              name="content"
              defaultValue={note.content ?? ""}
              rows={4}
            />
          </div>
          <ColorPicker name="color" value={note.color} />
          <DialogFooter className="flex justify-between gap-2">
            <Button type="submit" variant="destructive" formAction={deleteNote}>
              Delete
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateNote({ workspaceId }: { workspaceId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
        New note
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New note</DialogTitle>
        </DialogHeader>
        <form action={createNote} className="flex flex-col gap-4">
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-title">Title</Label>
            <Input id="new-title" name="title" autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-content">Content</Label>
            <Textarea id="new-content" name="content" rows={4} />
          </div>
          <ColorPicker name="color" value="yellow" />
          <DialogFooter>
            <Button type="submit" onClick={() => setOpen(false)}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NotesBoard({
  workspaceId,
  initialNotes,
}: {
  workspaceId: string;
  initialNotes: Note[];
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notes:${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => router.refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, router]);

  return (
    <div className="space-y-4">
      <CreateNote workspaceId={workspaceId} />
      {initialNotes.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
          No notes yet. Create the first one!
        </div>
      ) : (
        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
          {initialNotes.map((note) => (
            <div key={note.id} className="break-inside-avoid">
              <NoteCard note={note} workspaceId={workspaceId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
