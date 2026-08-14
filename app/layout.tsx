import type { Metadata } from "next";
import "./globals.css";
import { GlobalRevealObserver } from "./components";

export const metadata: Metadata = {
  title: "Alpha Imagem e Diagnóstico",
  description:
    "Exames diagnósticos com atendimento personalizado, equipe especializada e tecnologia avançada em Vitória, ES.",
  openGraph: {
    title: "Alpha Imagem e Diagnóstico",
    description: "Precisão médica, tecnologia avançada e cuidado em cada etapa do seu exame.",
    type: "website",
  },
  icons: {
    icon: "/favicon-alpha.svg",
    shortcut: "/favicon-alpha.svg",
    apple: "/favicon-alpha.svg",
  },
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body><GlobalRevealObserver />{children}</body></html>;
}
