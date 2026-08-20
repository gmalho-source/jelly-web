"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

type Copy = {
  email: string;
  submit: string;
  sending: string;
  sent: string;
  invalidEmail: string;
  tooMany: string;
  error: string;
};

export function SignInForm({ copy }: { copy: Copy }) {
  const pathname = usePathname();
  const endpoint = pathname.startsWith("/billing") ? "/billing/api/request-link" : "/api/request-link";

  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "invalid" | "throttled">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setState("invalid");
      return;
    }

    setState("sending");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (response.status === 429) setState("throttled");
      else if (!response.ok) setState("error");
      else setState("sent");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="border-l-2 border-lime bg-white p-4 text-[14px] text-navy" role="status">
        {copy.sent}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <label htmlFor="email" className="label">
          {copy.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "sending") setState("idle");
          }}
          aria-invalid={state === "invalid"}
          aria-describedby={state === "idle" || state === "sending" ? undefined : "sign-in-message"}
          className="border border-[#cfd6de] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-red focus:ring-3 focus:ring-red/15"
          placeholder="nome@empresa.pt"
        />
      </div>
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-fit bg-red px-6 py-3 text-[14px] font-medium text-white disabled:opacity-60"
      >
        {state === "sending" ? copy.sending : copy.submit}
      </button>
      {state === "invalid" || state === "error" || state === "throttled" ? (
        <p id="sign-in-message" className="text-[13px] text-red-dark" role="alert">
          {state === "invalid" ? copy.invalidEmail : state === "throttled" ? copy.tooMany : copy.error}
        </p>
      ) : null}
    </form>
  );
}
