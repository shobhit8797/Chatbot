"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { signOut } from "next-auth/react";
import MessageBubble from "./MessageBubble";
import type { Message } from "@/types";

type StoredState = {
  messages: Message[];
  persona: string | null;
};

const STORAGE_KEY = "council-chat-v1";
const MAX_HISTORY_TURNS = 10;

export default function ChatInterface({ userEmail }: { userEmail: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedPersona, setPinnedPersona] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: StoredState = JSON.parse(stored);
        setMessages(state.messages ?? []);
        setPinnedPersona(state.persona ?? null);
      }
    } catch {
      // sessionStorage unavailable or corrupted — start fresh
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function persist(msgs: Message[], persona: string | null) {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: msgs, persona } satisfies StoredState)
      );
    } catch {
      // Quota exceeded — silently continue
    }
  }

  function buildHistory(
    msgs: Message[]
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const history: Array<{ role: "user" | "assistant"; content: string }> = [];
    const recent = msgs.slice(-(MAX_HISTORY_TURNS * 2));
    for (const msg of recent) {
      if (msg.role === "user") {
        history.push({ role: "user", content: msg.content });
      } else if (msg.reply) {
        history.push({
          role: "assistant",
          content: JSON.stringify({
            persona: msg.reply.persona,
            language: msg.reply.language,
            native_text: msg.reply.native_text,
            english_translation: msg.reply.english_translation,
            panic_level: msg.diagnostics?.panic_level ?? 0,
          }),
        });
      }
    }
    return history;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
    };

    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setInput("");
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmedInput,
          history: buildHistory(messages),
          persona: pinnedPersona,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? `Server error ${res.status}`
        );
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply.english_translation,
        reply: data.reply,
        bubble: data.bubble,
        diagnostics: data.diagnostics,
      };

      const newPersona = pinnedPersona ?? data.reply.persona;
      const updated = [...withUser, assistantMsg];
      setMessages(updated);
      setPinnedPersona(newPersona);
      persist(updated, newPersona);

      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `${data.reply.persona} says: ${data.reply.english_translation}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleReset() {
    setMessages([]);
    setPinnedPersona(null);
    setError(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  return (
    <div className="flex flex-col h-screen bg-[#fdfbf6]">
      {/* Skip link */}
      <a
        href="#chat-input"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-[#0e0e0c] focus:text-[#fdfbf6] focus:rounded-lg focus:font-medium focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[#0e0e0c]/10 bg-[#fdfbf6]/95 backdrop-blur-sm">
        <div>
          <h1
            className="text-xl font-medium text-[#0e0e0c] tracking-tight"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Council of the Wise
          </h1>
          {pinnedPersona && (
            <p className="text-xs text-[#0e0e0c]/40 mt-0.5">
              Speaking with {pinnedPersona}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#0e0e0c]/35 hidden sm:block mr-1">
            {userEmail}
          </span>
          <button
            onClick={handleReset}
            className="text-xs text-[#0e0e0c]/50 hover:text-[#0e0e0c] px-3 py-1.5 rounded-lg border border-[#0e0e0c]/15 hover:border-[#0e0e0c]/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e0e0c]"
          >
            Reset
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-[#0e0e0c]/50 hover:text-[#0e0e0c] px-3 py-1.5 rounded-lg border border-[#0e0e0c]/15 hover:border-[#0e0e0c]/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e0e0c]"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Screen-reader live region */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Message list */}
      <main className="flex-1 overflow-y-auto py-6 space-y-5" id="main-content">
        {messages.length === 0 && (
          <div className="text-center py-24 px-4">
            <p
              className="text-[#0e0e0c]/30 text-lg"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              Pose your question to the council.
            </p>
            <p className="text-[#0e0e0c]/20 text-xs mt-2">
              Try a city + temperature, a decimal number, or any question.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-start px-4">
            <div className="max-w-[75%]">
              <div className="bg-[#0e0e0c]/5 rounded-2xl rounded-bl-sm px-5 py-4">
                <span className="text-[#0e0e0c]/30 text-sm">
                  The council deliberates…
                </span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center px-4">
            <div
              role="alert"
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 max-w-md"
            >
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {/* Input */}
      <footer className="sticky bottom-0 bg-[#fdfbf6]/95 backdrop-blur-sm border-t border-[#0e0e0c]/10 px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-3"
        >
          <label htmlFor="chat-input" className="sr-only">
            Message the council
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask the council…"
            rows={1}
            maxLength={4000}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-[#0e0e0c]/20 bg-white px-4 py-3 text-sm text-[#0e0e0c] placeholder:text-[#0e0e0c]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e0e0c] min-h-[48px] overflow-hidden"
            style={{ lineHeight: "1.5" }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-xl bg-[#0e0e0c] text-[#fdfbf6] text-sm font-medium hover:bg-[#0e0e0c]/80 disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e0e0c] whitespace-nowrap"
          >
            {loading ? "…" : "Send"}
          </button>
        </form>
        <p className="text-center text-[10px] text-[#0e0e0c]/25 mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}
