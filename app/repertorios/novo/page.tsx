"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { criarRepertorioAction } from "./actions";

export default function NovoRepertorioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !user) return;

    try {
      setSalvando(true);
      const resultado = await criarRepertorioAction({
        titulo,
        descricao,
        userId: user.uid,
      });

      if (resultado.sucesso) {
        router.push("/repertorios");
      } else {
        alert(resultado.erro || "Erro ao criar repertório.");
      }
    } catch (erro) {
      console.error("Erro ao criar repertório:", erro);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto">
      <header className="flex items-center gap-3 py-4 border-b border-slate-800 mb-6">
        <Link
          href="/repertorios"
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-amber-400">Novo Repertório</h1>
      </header>

      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Título do Repertório *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Culto de Domingo, Ensaio..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Descrição (Opcional)
          </label>
          <textarea
            rows={3}
            placeholder="Observações adicionais..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold p-3.5 rounded-xl transition flex items-center justify-center gap-2 mt-6 shadow-lg"
        >
          <Save size={18} />
          {salvando ? "A guardar..." : "Guardar Repertório"}
        </button>
      </form>
    </main>
  );
}