// Centralized note color palette. Store the KEY in the DB (not hex),
// map to Tailwind/bg values here so theming stays in one place.
export const NOTE_COLORS = {
  yellow: { bg: "bg-yellow-100", border: "border-yellow-300", label: "Yellow" },
  pink: { bg: "bg-pink-100", border: "border-pink-300", label: "Pink" },
  blue: { bg: "bg-blue-100", border: "border-blue-300", label: "Blue" },
  green: { bg: "bg-green-100", border: "border-green-300", label: "Green" },
  purple: { bg: "bg-purple-100", border: "border-purple-300", label: "Purple" },
  gray: { bg: "bg-gray-100", border: "border-gray-300", label: "Gray" },
} as const;

export type NoteColor = keyof typeof NOTE_COLORS;

export const NOTE_TYPES = ["note", "todo", "reminder"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const EXPENSE_CATEGORIES = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Education",
  "Other",
] as const;
