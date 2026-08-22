"use client";

import { useFormStatus } from "react-dom";
import Spinner from "./Spinner";

/**
 * Any <form action={someServerAction}> in this app should use this instead
 * of a raw <button> for its submit control. useFormStatus() only reports
 * the pending state of the nearest ancestor <form> once mounted inside it,
 * so this has to be its own client component — it can't be inlined into
 * the (server-rendered) page that renders the form.
 */
export default function SubmitButton({
  children,
  pendingText,
  pendingContent,
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  /** Replaces the button's text while submitting, e.g. "Saving…". Ignored if pendingContent is given. */
  pendingText?: string;
  /** Full override for pending content — used for compact/icon-only buttons where there's no room for text. */
  pendingContent?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button
      {...rest}
      disabled={pending || rest.disabled}
      aria-busy={pending}
      className={`${className} ${pending ? "opacity-60 cursor-wait" : ""}`}
    >
      {pending ? (
        pendingContent ?? (
          <span className="inline-flex items-center gap-1.5">
            <Spinner />
            {pendingText ?? "Working…"}
          </span>
        )
      ) : (
        children
      )}
    </button>
  );
}
