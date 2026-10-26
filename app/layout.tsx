import type { Metadata } from "next";
import { Inter, Noto_Sans_Meetei_Mayek } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const meeteiMayek = Noto_Sans_Meetei_Mayek({
  weight: ["400", "700"],
  subsets: ["meetei-mayek"],
  variable: "--font-meetei",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alpha Mathematics Academy | ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ (Bishnupur)",
  description:
    "Alpha Mathematics Academy (ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ) - An academy of mathematics where we will nurture you with the beauty of mathematics. Online Admission Form for Class IX & X in Bishnupur, Manipur.",
  keywords: [
    "Alpha Mathematics Academy",
    "ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ",
    "Bishnupur Manipur Mathematics",
    "Class IX X Coaching Bishnupur",
    "Mahei Leikol School Mathematics",
  ],
  authors: [{ name: "Alpha Mathematics Academy" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${meeteiMayek.variable}`}>
      <body className="antialiased selection:bg-indigo-500 selection:text-white bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
