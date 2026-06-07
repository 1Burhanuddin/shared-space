"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const data = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };

  const { error } = await supabase.auth.signInWithPassword(data);
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "");
  const data = {
    email: String(formData.get("email") || ""),
    password: String(formData.get("password") || ""),
  };

  const { data: signUpData, error } = await supabase.auth.signUp({
    ...data,
    options: { data: { name } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is disabled, session exists -> go to dashboard.
  if (signUpData.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  redirect("/login?message=Check your email to confirm your account");
}
