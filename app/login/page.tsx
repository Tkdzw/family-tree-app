import Link from "next/link";
import { loginUser } from "@/app/auth-actions";
import SubmitButton from "@/components/SubmitButton";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; registered?: string };
}) {
  return (
    <div className="max-w-[420px] mx-auto px-5 pt-20 pb-24">
      <Link href="/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-goldDim hover:text-gold">
        ← Back to tree
      </Link>

      <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-gold mt-6 mb-3">Sign in</p>
      <h1 className="font-display text-3xl font-semibold mb-3">Editor sign in</h1>
      <p className="text-boneDim text-[15px] leading-relaxed mb-8">
        Everyone can browse the tree without signing in. Signing in only unlocks adding, editing,
        and reordering — and requires an account.
      </p>

      {searchParams.registered && (
        <div className="bg-gold/10 border border-goldDim rounded-sm px-4 py-3 mb-6 text-sm text-gold">
          Account created — sign in below.
        </div>
      )}
      {searchParams.error && (
        <div className="bg-rust/10 border border-rust/40 rounded-sm px-4 py-3 mb-6 text-sm text-rust">
          {searchParams.error}
        </div>
      )}

      <form action={loginUser} className="space-y-4">
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-wide text-boneDim mb-1.5">Email</span>
          <input
            type="email"
            name="email"
            required
            className="w-full bg-panel border border-panelLine text-bone text-sm rounded-sm px-3.5 py-2.5 outline-none focus:border-goldDim"
          />
        </label>
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-wide text-boneDim mb-1.5">Password</span>
          <input
            type="password"
            name="password"
            required
            className="w-full bg-panel border border-panelLine text-bone text-sm rounded-sm px-3.5 py-2.5 outline-none focus:border-goldDim"
          />
        </label>
        <SubmitButton pendingText="Signing in…" className="w-full bg-gold/10 border border-goldDim text-gold text-sm font-medium px-4 py-2.5 rounded-sm hover:bg-gold/20">
          Sign in
        </SubmitButton>
      </form>

      <p className="text-boneDim text-sm mt-6">
        Don't have an editor account yet?{" "}
        <Link href="/register" className="text-gold hover:underline">
          Register with an invite code
        </Link>
        .
      </p>
    </div>
  );
}
