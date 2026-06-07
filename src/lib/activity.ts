import { createClient } from "@/lib/supabase/server";

type LogInput = {
  workspaceId: string;
  userId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Centralized activity logger. Every mutation should call this instead of
 * inserting activity rows manually. Failures are swallowed so logging never
 * breaks the primary action.
 */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("activity_logs").insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error("logActivity failed:", err);
  }
}
