import type { Message } from "@/types";

const LANG_CONFIG: Record<
  string,
  { dir: "rtl"; lang: string; fontClass: string; lineHeight: string }
> = {
  arabic: {
    dir: "rtl",
    lang: "ar",
    fontClass: "font-arabic",
    lineHeight: "2",
  },
  persian: {
    dir: "rtl",
    lang: "fa",
    fontClass: "font-persian",
    lineHeight: "2",
  },
  hebrew: {
    dir: "rtl",
    lang: "he",
    fontClass: "font-hebrew",
    lineHeight: "1.8",
  },
  urdu: {
    dir: "rtl",
    lang: "ur",
    fontClass: "font-urdu",
    lineHeight: "2.2",
  },
};

export default function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end px-4">
        <div className="max-w-[75%]">
          <div className="bg-[#0e0e0c] text-[#fdfbf6] rounded-2xl rounded-br-sm px-5 py-3 text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  if (!message.reply || !message.bubble) return null;

  const lang = LANG_CONFIG[message.reply.language] ?? LANG_CONFIG.arabic;

  return (
    <div className="flex items-start px-4 animate-fade-in">
      <div className="max-w-[75%] space-y-1.5">
        {/* Persona label */}
        <p className="text-xs text-[#0e0e0c]/40 px-1 font-medium">
          {message.reply.persona}
        </p>

        {/* Bubble */}
        <div
          className="rounded-2xl rounded-bl-sm px-5 py-4 space-y-3"
          style={{
            backgroundColor: message.bubble.background,
            color: message.bubble.foreground,
          }}
        >
          {/* Native RTL text */}
          <div
            dir={lang.dir}
            lang={lang.lang}
            className={`text-xl ${lang.fontClass}`}
            style={{ lineHeight: lang.lineHeight }}
          >
            {message.reply.native_text}
          </div>

          {/* Divider */}
          <hr
            aria-hidden="true"
            style={{ borderColor: `${message.bubble.foreground}25` }}
          />

          {/* English translation */}
          <p
            className="text-base leading-relaxed italic"
            lang="en"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            {message.reply.english_translation}
          </p>
        </div>

        {/* Diagnostic strip */}
        {message.bubble && (
          <DiagnosticStrip
            bubble={message.bubble}
            diagnostics={message.diagnostics}
          />
        )}
      </div>
    </div>
  );
}

function DiagnosticStrip({
  bubble,
  diagnostics,
}: {
  bubble: NonNullable<Message["bubble"]>;
  diagnostics?: Message["diagnostics"];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-[11px] text-[#0e0e0c]/40 leading-none">
      {/* Colour chip */}
      <span
        className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0 border border-[#0e0e0c]/15"
        style={{ backgroundColor: bubble.background }}
        aria-hidden="true"
      />
      {/* Rule name */}
      <span className="font-semibold text-[#0e0e0c]/55">{bubble.label}</span>
      <span aria-hidden="true">·</span>
      {/* One-sentence explanation */}
      <span>{bubble.explanation}</span>
      <span aria-hidden="true">·</span>
      {/* Hex value */}
      <code className="font-mono text-[10px]">{bubble.background}</code>
      {/* Extra diagnostic data where present */}
      {diagnostics?.panic_level !== undefined && bubble.rule === "tone" && (
        <>
          <span aria-hidden="true">·</span>
          <span>panic={diagnostics.panic_level.toFixed(2)}</span>
        </>
      )}
    </div>
  );
}
