"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function registerUser(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const inviteCode = (formData.get("inviteCode") as string) || "";

  if (!name || !email || !password) {
    redirect("/register?error=" + encodeURIComponent("All fields are required."));
  }
  if (password.length < 8) {
    redirect("/register?error=" + encodeURIComponent("Password needs to be at least 8 characters."));
  }
  if (!process.env.FAMILY_INVITE_CODE || inviteCode !== process.env.FAMILY_INVITE_CODE) {
    redirect("/register?error=" + encodeURIComponent("That invite code isn't right — ask whoever's administering the tree for it."));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/register?error=" + encodeURIComponent("An account with that email already exists — try signing in instead."));
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash } });

  redirect("/login?registered=1");
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: ((formData.get("email") as string) || "").trim().toLowerCase(),
      password: formData.get("password") as string,
      redirectTo: "/",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/login?error=" + encodeURIComponent("Email or password didn't match."));
    }
    throw err; // Next's own redirect() throws internally — let that pass through untouched
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}
