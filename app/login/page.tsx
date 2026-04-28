import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginButton from "./LoginButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/chat");

  const { error } = searchParams;
  let errorMessage: string | null = null;

  if (error === "DomainNotAllowed") {
    errorMessage =
      "Access is restricted to @petasight.com accounts. Please sign in with your Petasight Google account.";
  } else if (error === "OAuthCallback" || error === "OAuthSignin") {
    errorMessage = "Sign-in failed. Please try again.";
  } else if (error) {
    errorMessage = "Sign-in was not successful. Please try again.";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fdfbf6] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <h1
            className="text-5xl font-light text-[#0e0e0c] tracking-wide"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            Council of the Wise
          </h1>
          <p className="text-sm text-[#0e0e0c]/50 leading-relaxed">
            Philosophical counsel from across the ages,
            <br />
            in the languages of their wisdom.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 leading-relaxed"
          >
            {errorMessage}
          </div>
        )}

        <LoginButton />

        {process.env.ALLOWED_EMAIL_DOMAINS && (
          <p className="text-center text-xs text-[#0e0e0c]/30">
            Access restricted to {process.env.ALLOWED_EMAIL_DOMAINS} accounts
          </p>
        )}
      </div>
    </main>
  );
}
