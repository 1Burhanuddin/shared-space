import { EXPENSE_CATEGORIES } from "@/lib/constants";

export type ParsedExpense = {
  amount: number;
  category: string;
  description: string;
  confidence: "high" | "low";
};

// Simple keyword -> category map for the deterministic fast path.
const CATEGORY_KEYWORDS: Record<string, string> = {
  coffee: "Food", lunch: "Food", dinner: "Food", pizza: "Food", food: "Food",
  groceries: "Food", restaurant: "Food",
  uber: "Travel", taxi: "Travel", flight: "Travel", train: "Travel",
  petrol: "Travel", fuel: "Travel", gas: "Travel",
  shopping: "Shopping", clothes: "Shopping", amazon: "Shopping",
  bill: "Bills", electricity: "Bills", rent: "Bills", internet: "Bills",
  medicine: "Health", doctor: "Health", pharmacy: "Health",
  book: "Education", course: "Education", tuition: "Education",
};

function guessCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [kw, cat] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(kw)) return cat;
  }
  return "Other";
}

/**
 * Deterministic regex parser. Handles inputs like:
 *   "Spent 250 on coffee", "Paid 500 for petrol", "Uber 180", "coffee 60"
 * Returns null when it cannot confidently extract an amount.
 */
export function parseExpenseRegex(input: string): ParsedExpense | null {
  const amountMatch = input.match(/(?:[₹$€£]\s*)?(\d+(?:\.\d{1,2})?)/);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1]);
  if (!amount || amount <= 0) return null;

  const description = input
    .replace(/(?:spent|paid|for|on|rs\.?|inr)/gi, " ")
    .replace(/(?:[₹$€£]\s*)?\d+(?:\.\d{1,2})?/, " ")
    .replace(/\s+/g, " ")
    .trim();

  const category = guessCategory(input);
  return {
    amount,
    category,
    description: description || category,
    confidence: "high",
  };
}

export function isValidCategory(c: string): boolean {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(c);
}
