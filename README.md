# Council of the Wise

A single-purpose, authenticated chatbot for the Petasight engineering challenge. Each user message receives a reply from a historical philosopher in a right-to-left language (with an English translation underneath), and the colour of every reply bubble is derived deterministically from the content of the message itself via a three-rule precedence engine.

**Live URL:** _deploy to Vercel and paste here_
**Repo:** this repository

---

## What it does

- **Google SSO** restricted to `@petasight.com` (server-side domain check, not just a client hint)
- **Three-rule precedence engine** that deterministically colours every reply bubble:
  - **Rule 1 — Temperature:** fires when the message names a city *and* a temperature → 9-step blue-to-red palette
  - **Rule 2 — Decimal:** fires when the entire message is a bare decimal number → 7-step sepia palette keyed on the first two decimal digits
  - **Rule 3 — Tone (fallback):** the LLM rates emotional intensity 0–1 → 7-step yellow-to-violet palette
- **Philosophical personas:** Ibn Sina, Al-Khwarizmi, Al-Ghazali (Arabic); Rumi, Hafez, Omar Khayyam (Persian); Maimonides (Hebrew); Allama Iqbal, Mirza Ghalib (Urdu) — pinned per session
- **Diagnostic strip** under every assistant bubble shows which rule fired, why, and the exact hex value
- **WCAG 2.0 AA** — worst-case contrast ratio across all possible inputs is 4.62:1 (Rule 1 at >35°C), verified by `npm run verify:contrast`

---

## Architecture

```
app/
  api/
    auth/[...nextauth]/route.ts   NextAuth v4 handler
    chat/route.ts                 Chat endpoint — auth check, LLM call, palette engine
  chat/page.tsx                   Server component — re-validates session on every render
  login/page.tsx                  Login page + error handling
  layout.tsx                      Fonts: Cormorant Garamond, Geist, Noto Naskh Arabic, Vazirmatn, Frank Ruhl Libre
components/
  ChatInterface.tsx               Client component — sessionStorage persistence, message state
  MessageBubble.tsx               Renders user and assistant messages; RTL font + dir/lang attributes
lib/
  auth.ts                         NextAuth options + domain allowlist
  llm.ts                          Anthropic SDK wrapper — system prompt, Zod schema, tolerant JSON extractor
  palette.ts                      Deterministic precedence engine — pure function, no LLM dependency
middleware.ts                     Edge middleware — redirects unauthenticated /chat requests to /login
scripts/
  verify-contrast.ts              Sweeps 108+ input combinations, exits 1 on any ratio < 4.5:1
types/index.ts                    Shared TypeScript types
```

**Key architectural seam:** the LLM is an untrusted source. It produces `city`, `temperature_c`, and `panic_level` as diagnostic fields — but the palette engine in `lib/palette.ts` is a pure deterministic function. A misbehaving LLM can never produce a non-compliant bubble colour, and the styling rules are fully unit-testable without touching the LLM.

**Why discrete swatches instead of smooth interpolation:** linear-RGB interpolation between anchor colours produces midtones around 29°C (Rule 1) and `.59` (Rule 2) that land in a luminance band where neither ink nor parchment reaches 4.5:1 (worst observed: 4.34:1 with interpolation). Hand-tuned discrete swatches with pre-verified foreground tokens give a hard guarantee across the full input range.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Auth | NextAuth v4 (Google OAuth) |
| LLM | Anthropic SDK (`claude-opus-4-7`) |
| Validation | Zod |
| Fonts | Cormorant Garamond, Geist, Noto Naskh Arabic, Vazirmatn, Frank Ruhl Libre |
| Deploy | Vercel |

---

## Local setup (~15 minutes)

### Prerequisites

- Node.js 18+
- A Google Cloud project with an OAuth 2.0 client ID (see below)
- An Anthropic API key

### 1 — Clone and install

```bash
git clone <repo-url>
cd Chatbot
npm install
```

### 2 — Configure Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/auth/callback/google` to **Authorised redirect URIs**
4. Copy the Client ID and Client Secret

### 3 — Set environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GOOGLE_CLIENT_ID=<your client id>
GOOGLE_CLIENT_SECRET=<your client secret>
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
ANTHROPIC_API_KEY=<your anthropic key>

# Default is petasight.com — override to test with your own domain:
# ALLOWED_EMAIL_DOMAINS=petasight.com,yourdomain.com
```

### 4 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root redirects to `/chat`, which redirects to `/login` if unauthenticated.

---

## Verifying the implementation

### Run the contrast check

```bash
npm run verify:contrast
```

Expected output:
```
Total cases : 108
Failures    : 0
Worst ratio : 4.62:1  (Rule 1 — 36°C in Cairo)

✓ All cases pass WCAG 2.0 AA (≥ 4.5:1)
```

### Run the type check

```bash
npm run typecheck
```

### Six demo prompts

After signing in, send each prompt and confirm the expected rule fires (the diagnostic strip under the bubble shows the rule name and hex):

| Prompt | Expected rule | Expected colour family |
|---|---|---|
| `It is 38°C in Cairo` | Rule 1 — Temperature | Bright red `#e02020` |
| `It is 5°C in Reykjavik` | Rule 1 — Temperature | Royal blue `#1d3b9c` |
| `3.14159` | Rule 2 — Decimal (`.14`) | Parchment `#faf6ec` |
| `0.97` | Rule 2 — Decimal (`.97`) | Dark brown `#26180c` |
| `MY DEMO STARTS IN 2 MINUTES AND THE BUILD IS BROKEN!!` | Rule 3 — Tone (high panic) | Magenta/violet |
| `Just sat in the garden listening to the rain` | Rule 3 — Tone (low panic) | Pale yellow |

---

## Deployment to Vercel

```bash
npx vercel
```

Or connect the GitHub repo via the Vercel dashboard.

**Required environment variables in Vercel:**

| Variable | Notes |
|---|---|
| `GOOGLE_CLIENT_ID` | |
| `GOOGLE_CLIENT_SECRET` | |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL, e.g. `https://your-app.vercel.app` |
| `ANTHROPIC_API_KEY` | |
| `ALLOWED_EMAIL_DOMAINS` | Defaults to `petasight.com` |

**Add the production callback URL to Google OAuth:**
`https://your-app.vercel.app/api/auth/callback/google`

---

## Palette reference

### Rule 1 — Temperature gradient

| Up to | Background | Foreground | Label | Ratio |
|---|---|---|---|---|
| 0°C | `#0c247a` | parchment | deep blue | 13.11:1 |
| 5°C | `#1d3b9c` | parchment | royal blue | 9.41:1 |
| 10°C | `#4a4ea3` | parchment | periwinkle | 6.98:1 |
| 15°C | `#c49cde` | ink | light purple | 8.43:1 |
| 20°C | `#e0b6cf` | ink | mauve | 10.82:1 |
| 25°C | `#d28aa0` | ink | rose | 7.25:1 |
| 30°C | `#a83a4e` | parchment | rich crimson | 6.01:1 |
| 35°C | `#c41f1f` | parchment | red | 5.70:1 |
| >35°C | `#e02020` | parchment | bright red | 4.62:1 |

### Rule 2 — Decimal sepia spectrum

| Up to | Background | Foreground | Label | Ratio |
|---|---|---|---|---|
| .14 | `#faf6ec` | ink | parchment | 17.90:1 |
| .28 | `#ecd9b3` | ink | cream | 13.93:1 |
| .42 | `#d4ae6f` | ink | tan | 9.28:1 |
| .56 | `#a87d3e` | ink | sepia | 5.22:1 |
| .70 | `#7a5424` | parchment | umber | 6.51:1 |
| .84 | `#4d3416` | parchment | mocha | 11.17:1 |
| .99 | `#26180c` | parchment | dark brown | 16.67:1 |

### Rule 3 — Tone gradient

| Up to | Background | Foreground | Label | Ratio |
|---|---|---|---|---|
| 0.14 | `#faf0aa` | ink | pale yellow | 16.66:1 |
| 0.28 | `#f7d97a` | ink | warm yellow | 13.95:1 |
| 0.42 | `#f4a86b` | ink | peach | 9.81:1 |
| 0.56 | `#e26780` | ink | rose-pink | 5.97:1 |
| 0.70 | `#c43a96` | parchment | magenta | 4.62:1 |
| 0.84 | `#7e2cb8` | parchment | violet | 6.91:1 |
| 1.00 | `#5a1f9a` | parchment | deep violet | 9.68:1 |

Foreground tokens: ink `#0e0e0c`, parchment `#fdfbf6`.

---

## AI and dev tools used

- **Claude (Anthropic)** — architectural planning, code generation, system prompt design, palette verification strategy
- **Claude Code** — implementation of the full stack from the PRD
- **Next.js App Router, NextAuth v4, Tailwind CSS, Zod, Anthropic SDK** — runtime stack

The implementation approach was to treat the LLM as an untrusted structured-data source and keep all style logic server-side and deterministic. This made the colour rules auditable, unit-testable, and provably WCAG-compliant without relying on LLM behaviour.
