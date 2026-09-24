"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Music, FolderKanban, LogOut, Loader2 } from "lucide-react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        {/* Barra superior com Utilizador e Sair */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-900 text-xs text-slate-400">
          <span className="truncate max-w-[220px]">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition"
            title="Terminar Sessão"
          >
            <LogOut size={14} />
            <span>Sair</span>
          </button>
        </div>

        {/* Cabeçalho com Logo CifraGo Centralizada */}
        <header className="flex flex-col items-center py-4 border-b border-slate-800/80 mb-6">
          <div className="relative w-32 h-28 drop-shadow-[0_10px_20px_rgba(245,158,11,0.15)] mb-2">
            <Image
              src="/logo.png"
              alt="Logo CifraGo"
              fill
              className="object-contain"
              priority
            />
          </div>

          <p className="text-center text-xs text-amber-400/90 font-medium tracking-wide italic">
            Seus acordes, o seu ritmo
          </p>
        </header>

        {/* Navegação Principal */}
        <nav className="space-y-4">
          <Link
            href="/musicas"
            className="flex items-center justify-between bg-slate-900/90 p-5 rounded-2xl border border-amber-500/20 hover:border-amber-400/60 hover:bg-slate-900 transition group shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition shadow-sm">
                <Music size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-100 group-hover:text-amber-400 transition">
                  Músicas
                </h2>
                <p className="text-xs text-slate-400">Ver e gerir catálogo de cifras</p>
              </div>
            </div>
          </Link>

          <Link
            href="/repertorios"
            className="flex items-center justify-between bg-slate-900/90 p-5 rounded-2xl border border-amber-500/20 hover:border-amber-400/60 hover:bg-slate-900 transition group shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-slate-950 transition shadow-sm">
                <FolderKanban size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-100 group-hover:text-amber-400 transition">
                  Repertórios
                </h2>
                <p className="text-xs text-slate-400">Listas para ensaios e apresentações</p>
              </div>
            </div>
          </Link>
        </nav>
      </div>

      <footer className="text-center py-4 text-[11px] text-slate-500">
        CifraGo App &bull; <span className="text-amber-500/70">Seus acordes, o seu ritmo</span>
      </footer>
    </main>
  );
}