"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function EditarRepertorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: repertorioId } = use(params);
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const projectId = "app-cifras-bcdce";

  useEffect(() => {
    async function carregarRepertorio() {
      try {
        const res = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}`
        );

        if (res.ok) {
          const doc = await res.json();
          const f = doc.fields || {};
          setTitulo(f.titulo?.stringValue || "");
          setDescricao(f.descricao?.stringValue || "");
        }
      } catch (erro) {
        console.error("Erro ao carregar repertório:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarRepertorio();
  }, [repertorioId]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    try {
      setSalvando(true);
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}?updateMask.fieldPaths=titulo&updateMask.fieldPaths=descricao`;

      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            titulo: { stringValue: titulo },
            descricao: { stringValue: descricao },
          },
        }),
      });

      if (res.ok) {
        router.push("/repertorios");
      }
    } catch (erro) {
      console.error("Erro ao atualizar repertório:", erro);
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <p className="text-slate-400">A carregar repertório...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto">
      <header className="flex items-center gap-3 py-4 border-b border-slate-800 mb-6">
        <Link
          href="/repertorios"
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-amber-400">Editar Repertório</h1>
      </header>

      <form onSubmit={handleSalvar} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
            Título do Repertório *
          </label>
          <input
            type="text"
            required
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
          {salvando ? "A guardar..." : "Salvar Alterações"}
        </button>
      </form>
    </main>
  );
}