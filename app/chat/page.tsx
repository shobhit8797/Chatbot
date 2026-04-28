import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import ChatInterface from "@/components/ChatInterface";

const ALLOWED_EMAIL_DOMAINS_ENV = process.env.ALLOWED_EMAIL_DOMAINS ?? "";
const allowedDomains = ALLOWED_EMAIL_DOMAINS_ENV
  ? ALLOWED_EMAIL_DOMAINS_ENV.split(",").map((d) => d.trim().toLowerCase())
  : [];

export default async function ChatPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (allowedDomains.length > 0) {
    const domain = session.user.email.split("@")[1]?.toLowerCase();
    if (!domain || !allowedDomains.includes(domain)) {
      redirect("/login?error=DomainNotAllowed");
    }
  }

  return <ChatInterface userEmail={session.user.email} />;
}
