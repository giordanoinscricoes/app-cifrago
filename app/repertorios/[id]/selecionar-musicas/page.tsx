"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Check, Save, Music } from "lucide-react";
import { salvarMusicasDoRepertorioAction } from "../actions";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tomOriginal: string;
}

export default function SelecionarMusicasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: repertorioId } = use(params);
  const router = useRouter();

  const [todasMusicas, setTodasMusicas] = useState<Musica[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const projectId = "app-cifras-bcdce";

  useEffect(() => {
    async function inicializar() {
      try {
        setCarregando(true);

        // 1. Carregar Repertório para saber quais músicas já estão selecionadas
        const resRep = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}`,
          { cache: "no-store" }
        );

        if (resRep.ok) {
          const docRep = await resRep.json();
          const fRep = docRep.fields || {};
          const ids: string[] =
            fRep.musicasIds?.arrayValue?.values?.map(
              (v: any) => v.stringValue
            ) || [];
          setSelecionadas(ids);
        }

        // 2. Carregar catálogo completo de músicas
        const resMus = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas`,
          { cache: "no-store" }
        );

        if (resMus.ok) {
          const dados = await resMus.json();
          if (dados.documents) {
            const lista: Musica[] = dados.documents.map((doc: any) => {
              const id = doc.name.split("/").pop();
              const f = doc.fields || {};
              return {
                id,
                titulo: f.titulo?.stringValue || "Sem título",
                artista: f.artista?.stringValue || "Artista desconhecido",
                tomOriginal: f.tomOriginal?.stringValue || "C",
              };
            });
            setTodasMusicas(lista);
          }
        }
      } catch (erro) {
        console.error("Erro ao carregar catálogo:", erro);
      } finally {
        setCarregando(false);
      }
    }

    inicializar();
  }, [repertorioId]);

  const toggleSelecao = (id: string) => {
    setSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSalvar = async () => {
    setSalvando(true);
    const res = await salvarMusicasDoRepertorioAction(repertorioId, selecionadas);
    setSalvando(false);

    if (res.sucesso) {
      router.push(`/repertorios/${repertorioId}`);
    } else {
      alert(res.erro || "Erro ao salvar músicas.");
    }
  };

  const musicasFiltradas = todasMusicas.filter(
    (m) =>
      m.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      m.artista.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <p className="text-slate-400">A carregar músicas do catálogo...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        {/* Cabeçalho */}
        <header className="flex items-center justify-between py-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/repertorios/${repertorioId}`}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-amber-400">Selecionar Músicas</h1>
          </div>

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg"
          >
            <Save size={16} />
            <span>{salvando ? "A guardar..." : "Concluir"}</span>
          </button>
        </header>

        {/* Pesquisa */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por título ou artista..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
          />
        </div>

        {/* Contador */}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Músicas Selecionadas ({selecionadas.length})
        </p>

        {/* Lista de Seleção */}
        {musicasFiltradas.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <Music size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma música encontrada no catálogo.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-6">
            {musicasFiltradas.map((m) => {
              const estaSelecionada = selecionadas.includes(m.id);

              return (
                <div
                  key={m.id}
                  onClick={() => toggleSelecao(m.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                    estaSelecionada
                      ? "bg-amber-500/10 border-amber-500/60"
                      : "bg-slate-800/80 border-slate-700/60 hover:border-slate-600"
                  }`}
                >
                  <div className="flex-1 overflow-hidden pr-2">
                    <h2 className="font-semibold text-slate-100 truncate text-sm">
                      {m.titulo}
                    </h2>
                    <p className="text-xs text-slate-400 truncate">{m.artista}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold px-2 py-0.5 rounded text-xs">
                      {m.tomOriginal}
                    </span>

                    <div
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition ${
                        estaSelecionada
                          ? "bg-amber-500 border-amber-500 text-slate-950"
                          : "border-slate-600 bg-slate-900"
                      }`}
                    >
                      {estaSelecionada && <Check size={16} className="stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}