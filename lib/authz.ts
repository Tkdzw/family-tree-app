import { auth } from "@/auth";

/**
 * Throws if there's no signed-in user. Every action that adds, edits, or
 * deletes data calls this FIRST, before touching the database.
 *
 * This matters even though the edit UI is already hidden from signed-out
 * visitors on every page — hiding a button doesn't stop someone from
 * calling the underlying server action directly. The real access control
 * has to live in the action itself, not just in what's rendered.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("You need to be signed in to do that.");
  }
  return session.user;
}
