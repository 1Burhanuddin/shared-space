import OpenAI from "openai";
import { EXPENSE_PARSE_SYSTEM_PROMPT } from "./prompts";
import { parseExpenseRegex, isValidCategory, type ParsedExpense } from "./parser";

let _client: OpenAI | null = null;
function client() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

/**
 * Parse an expense from natural language.
 * Fast path: deterministic regex. Fallback: OpenAI for ambiguous input.
 */
export async function parseExpense(input: string): Promise<ParsedExpense> {
  const fast = parseExpenseRegex(input);
  if (fast && fast.category !== "Other") return fast;

  // Ambiguous -> ask the model.
  const res = await client().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EXPENSE_PARSE_SYSTEM_PROMPT },
      { role: "user", content: input },
    ],
  });
  const raw = res.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);
  return {
    amount: Number(parsed.amount) || fast?.amount || 0,
    category: isValidCategory(parsed.category) ? parsed.category : "Other",
    description: parsed.description || fast?.description || input,
    confidence: "low",
  };
}

export { parseExpenseRegex } from "./parser";
