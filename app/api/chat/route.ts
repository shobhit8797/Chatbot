import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { callLLM, ConversationTurn } from "@/lib/llm";
import { resolveBubble } from "@/lib/palette";

export const runtime = "nodejs";

const ALLOWED_EMAIL_DOMAINS_ENV = process.env.ALLOWED_EMAIL_DOMAINS ?? "";
const allowedDomains = ALLOWED_EMAIL_DOMAINS_ENV
  ? ALLOWED_EMAIL_DOMAINS_ENV.split(",").map((d) => d.trim().toLowerCase())
  : [];

const RequestSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(20)
    .default([]),
  persona: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (allowedDomains.length > 0) {
    const domain = session.user.email.split("@")[1]?.toLowerCase();
    if (!domain || !allowedDomains.includes(domain)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { message, history, persona } = parsed.data;

  try {
    const llmResponse = await callLLM(
      message,
      history as ConversationTurn[],
      persona ?? null
    );

    const bubble = resolveBubble(
      message,
      llmResponse.city,
      llmResponse.temperature_c,
      llmResponse.panic_level
    );

    return NextResponse.json({
      reply: {
        persona: llmResponse.persona,
        language: llmResponse.language,
        native_text: llmResponse.native_text,
        english_translation: llmResponse.english_translation,
      },
      bubble,
      diagnostics: {
        city: llmResponse.city,
        temperature_c: llmResponse.temperature_c,
        panic_level: llmResponse.panic_level,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error:
          "The council is momentarily silent. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
