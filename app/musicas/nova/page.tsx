"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarMusicaAction } from "./actions";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NovaMusicaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [artista, setArtista] = useState("");
  const [tomOriginal, setTomOriginal] = useState("C");
  const [cifra, setCifra] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState("");

  const salvarMusica = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro("");

    if (!titulo.trim()) return alert("Digite o título da música!");

    try {
      setCarregando(true);

      const resultado = await criarMusicaAction({
        titulo,
        artista,
        tomOriginal,
        cifra,
      });

      if (resultado.sucesso) {
        // Redireciona para a lista de músicas após salvar
        router.push("/musicas");
        router.refresh();
      } else {
        setMensagemErro(resultado.erro || "Ocorreu um erro ao salvar.");
      }
    } catch (erro: any) {
      setMensagemErro("Erro ao enviar dados para o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto">
      <header className="flex items-center gap-3 mb-6 pt-2 border-b border-slate-800 pb-4">
        <Link
          href="/musicas"
          className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-amber-400">Nova Música</h1>
      </header>

      {mensagemErro && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-sm">
          <strong>Erro:</strong> {mensagemErro}
        </div>
      )}

      <form onSubmit={salvarMusica} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Título da Música *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Porque Ele Vive"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Artista / Cantor
          </label>
          <input
            type="text"
            placeholder="Ex: Harpa Cristã"
            value={artista}
            onChange={(e) => setArtista(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Tom Original
          </label>
          <select
            value={tomOriginal}
            onChange={(e) => setTomOriginal(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 focus:outline-none focus:border-amber-400"
          >
            {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
              (nota) => (
                <option key={nota} value={nota}>
                  {nota}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Cifra / Letra
          </label>
          <textarea
            rows={8}
            placeholder="Cole aqui a cifra ou letra da música..."
            value={cifra}
            onChange={(e) => setCifra(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-amber-700 text-slate-950 font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
        >
          <Save size={20} />
          {carregando ? "A salvar..." : "Salvar Música"}
        </button>
      </form>
    </main>
  );
}