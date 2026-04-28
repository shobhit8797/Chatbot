import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Empty string means allow all verified Google accounts
const ALLOWED_EMAIL_DOMAINS_ENV = process.env.ALLOWED_EMAIL_DOMAINS ?? "";
const allowedDomains = ALLOWED_EMAIL_DOMAINS_ENV
  ? ALLOWED_EMAIL_DOMAINS_ENV.split(",").map((d) => d.trim().toLowerCase())
  : [];

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          ...(allowedDomains.length === 1 ? { hd: allowedDomains[0] } : {}),
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      const p = profile as { email_verified?: boolean; email?: string };
      if (!p.email_verified) return false;
      if (allowedDomains.length > 0) {
        const domain = p.email?.split("@")[1]?.toLowerCase();
        if (!domain || !allowedDomains.includes(domain)) {
          return "/login?error=DomainNotAllowed";
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
