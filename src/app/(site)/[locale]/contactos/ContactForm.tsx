"use client";

import { useState } from "react";

type Copy = {
  name: string;
  company: string;
  email: string;
  message: string;
  messageHint: string;
  submit: string;
  sending: string;
  sent: string;
  error: string;
  invalid: string;
};

export function ContactForm({ copy }: { copy: Copy }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "invalid">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      name: String(data.get("name") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    if (!payload.name || !payload.message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) {
      setState("invalid");
      return;
    }

    setState("sending");
    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p className="rounded-[20px] border-l-2 border-chartreuse bg-white p-6 text-md text-fg-soft" role="status">
        {copy.sent}
      </p>
    );
  }

  const field = "rounded-[4px] border border-line bg-white px-3.5 py-3 text-sm shadow-xs outline-none transition-colors duration-200 focus:border-red";

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <label htmlFor="name" className="eyebrow text-fg-soft">{copy.name}</label>
        <input id="name" name="name" required autoComplete="name" className={field} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="company" className="eyebrow text-fg-soft">{copy.company}</label>
        <input id="company" name="company" autoComplete="organization" className={field} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="email" className="eyebrow text-fg-soft">{copy.email}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={field} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="message" className="eyebrow text-fg-soft">{copy.message}</label>
        <textarea id="message" name="message" required rows={4} placeholder={copy.messageHint} className={field} />
      </div>
      <button type="submit" disabled={state === "sending"} className="btn w-fit disabled:opacity-40">
        {state === "sending" ? copy.sending : copy.submit} <span aria-hidden="true">→</span>
      </button>
      {state === "invalid" || state === "error" ? (
        <p className="text-sm text-red-deep" role="alert">
          {state === "invalid" ? copy.invalid : copy.error}
        </p>
      ) : null}
    </form>
  );
}
