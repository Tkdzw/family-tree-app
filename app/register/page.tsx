import Link from "next/link";
import { registerUser } from "@/app/auth-actions";

export default function RegisterPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="max-w-[420px] mx-auto px-5 pt-20 pb-24">
      <Link href="/" className="font-mono text-[11px] tracking-[0.1em] uppercase text-goldDim hover:text-gold">
        ← Back to tree
      </Link>

      <p className="font-mono text-[11.5px] tracking-[0.14em] uppercase text-gold mt-6 mb-3">Register</p>
      <h1 className="font-display text-3xl font-semibold mb-3">Create an editor account</h1>
      <p className="text-boneDim text-[15px] leading-relaxed mb-8">
        You'll need the family invite code to register — ask whoever's administering the tree for
        it. Anyone can still browse and search everything without an account.
      </p>

      {searchParams.error && (
        <div className="bg-rust/10 border border-rust/40 rounded-sm px-4 py-3 mb-6 text-sm text-rust">
          {searchParams.error}
        </div>
      )}

      <form action={registerUser} className="space-y-4">
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-wide text-boneDim mb-1.5">Your name</span>
          <input
            name="name"
            required
            className="w-full bg-panel border border-panelLine text-bone text-sm rounded-sm px-3.5 py-2.5 outline-none focus:border-goldDim"
          />
        </label>
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
            minLength={8}
            className="w-full bg-panel border border-panelLine text-bone text-sm rounded-sm px-3.5 py-2.5 outline-none focus:border-goldDim"
          />
          <span className="block text-[11px] text-boneDim mt-1">At least 8 characters.</span>
        </label>
        <label className="block">
          <span className="block font-mono text-[10px] uppercase tracking-wide text-boneDim mb-1.5">Invite code</span>
          <input
            name="inviteCode"
            required
            className="w-full bg-panel border border-panelLine text-bone text-sm rounded-sm px-3.5 py-2.5 outline-none focus:border-goldDim"
          />
        </label>
        <button className="w-full bg-gold/10 border border-goldDim text-gold text-sm font-medium px-4 py-2.5 rounded-sm hover:bg-gold/20">
          Create account
        </button>
      </form>

      <p className="text-boneDim text-sm mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
