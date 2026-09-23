"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

export default function BotaoInicio() {
  const pathname = usePathname();

  // Se estivermos na tela inicial ("/"), não exibe o botão
  if (pathname === "/") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link
        href="/"
        className="flex items-center justify-center w-12 h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-2xl transition transform hover:scale-105 active:scale-95 border-2 border-slate-900"
        title="Voltar à Tela Inicial"
      >
        <Home size={22} />
      </Link>
    </div>
  );
}