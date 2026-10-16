"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Maximize2, Minimize2 } from "lucide-react";
import { editarMusicaAction } from "../actions";
import { auth } from "@/lib/firebase"; // <--- 1. Importar o auth

export default function EditarMusicaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: musicaId } = use(params);
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [artista, setArtista] = useState("");
  const [tomOriginal, setTomOriginal] = useState("C");
  const [cifra, setCifra] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [emTelaCheia, setEmTelaCheia] = useState(false);

  const containerCifraRef = useRef<HTMLDivElement>(null);
  const projectId = "app-cifras-bcdce";

  useEffect(() => {
    async function carregarMusica() {
      try {
        const res = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas/${musicaId}`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const doc = await res.json();
          const f = doc.fields || {};
          setTitulo(f.titulo?.stringValue || "");
          setArtista(f.artista?.stringValue || "");
          setTomOriginal(f.tomOriginal?.stringValue || "C");
          setCifra(f.cifra?.stringValue || "");
        }
      } catch (e) {
        console.error("Erro ao carregar música:", e);
      } finally {
        setCarregando(false);
      }
    }
    carregarMusica();
  }, [musicaId]);

  const alternarTelaCheia = () => {
    if (!document.fullscreenElement && containerCifraRef.current) {
      containerCifraRef.current.requestFullscreen().catch((err) => {
        console.error("Erro ao tentar entrar em tela cheia:", err);
      });
      setEmTelaCheia(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setEmTelaCheia(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !artista) {
      alert("Por favor, preencha o título e o artista.");
      return;
    }

    setSalvando(true);
    
    // Obter o e-mail do utilizador atualmente logado
    const user = auth.currentUser;

    const res = await editarMusicaAction(musicaId, {
      titulo,
      artista,
      tomOriginal,
      cifra,
      criadoPor: user?.email ?? "", // <--- 2. Enviar o email do criador/editor
    });

    if (res.sucesso) {
      router.push("/musicas");
    } else {
      alert(res.erro || "Erro ao salvar alterações.");
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <p className="text-slate-400">A carregar música...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        <header className="flex items-center gap-3 py-4 border-b border-slate-800 mb-6">
          <Link
            href="/musicas"
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-amber-400">Editar Música</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título da Música *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-400 transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Artista / Banda *
            </label>
            <input
              type="text"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-400 transition text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tom Original
            </label>
            <select
              value={tomOriginal}
              onChange={(e) => setTomOriginal(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-400 transition text-sm"
            >
              {[
                "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
                "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm",
              ].map((tom) => (
                <option key={tom} value={tom}>
                  {tom}
                </option>
              ))}
            </select>
          </div>

          {/* Bloco da Cifra com suporte a expansão / ecrã cheio */}
          <div ref={containerCifraRef} className={`${emTelaCheia ? 'bg-slate-900 p-4 h-screen flex flex-col' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Cifra / Letra
              </label>
              <button
                type="button"
                onClick={alternarTelaCheia}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700 transition"
                title="Expandir campo de texto"
              >
                {emTelaCheia ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{emTelaCheia ? "Normal" : "Expandir"}</span>
              </button>
            </div>
            <textarea
              value={cifra}
              onChange={(e) => setCifra(e.target.value)}
              rows={8}
              placeholder="Cole aqui a cifra ou letra da música..."
              className={`w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-400 transition ${
                emTelaCheia ? "flex-1 h-[80vh]" : ""
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 transition mt-6"
          >
            <Save size={20} />
            {salvando ? "A guardar..." : "Salvar Alterações"}
          </button>
        </form>
      </div>
    </main>
  );
}