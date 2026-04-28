export type Language = "arabic" | "persian" | "hebrew" | "urdu";

export type BubbleStyle = {
  background: string;
  foreground: string;
  rule: "temperature" | "decimal" | "tone";
  label: string;
  explanation: string;
};

export type MessageDiagnostics = {
  city?: string;
  temperature_c?: number;
  panic_level?: number;
};

export type AssistantReply = {
  persona: string;
  language: Language;
  native_text: string;
  english_translation: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reply?: AssistantReply;
  bubble?: BubbleStyle;
  diagnostics?: MessageDiagnostics;
};
