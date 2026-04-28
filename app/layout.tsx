import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Noto_Naskh_Arabic,
  Vazirmatn,
  Frank_Ruhl_Libre,
} from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Providers from "./Providers";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-cormorant",
  display: "swap",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-persian",
  display: "swap",
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["hebrew"],
  weight: ["400", "500", "700"],
  variable: "--font-hebrew",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Council of the Wise",
  description:
    "A chatbot that channels historical philosophers writing in right-to-left scripts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${notoNaskhArabic.variable} ${vazirmatn.variable} ${frankRuhl.variable} ${GeistSans.variable}`}
    >
      <body className={`${GeistSans.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
