"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Check, Music } from "lucide-react";
import { serviceGetRepertorioPorId, serviceAtualizarRepertorio } from "@/lib/firebase-functions";

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

  const [musicasDisponiveis, setMusicasDisponiveis] = useState<Musica[]>([]);
  const [musicasSelecionadasIds, setMusicasSelecionadasIds] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const projectId = "app-cifras-bcdce";

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);

        // 1. Carregar o repertório atual para saber quais músicas já estão selecionadas
        const repertorio: any = await serviceGetRepertorioPorId(repertorioId);
        if (repertorio && repertorio.musicasIds) {
          setMusicasSelecionadasIds(repertorio.musicasIds);
        }

        // 2. Carregar todas as músicas cadastradas
        const resMusicas = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas`,
          { cache: "no-store" }
        );

        if (resMusicas.ok) {
          const dadosMusicas = await resMusicas.json();
          if (dadosMusicas.documents) {
            const lista: Musica[] = dadosMusicas.documents.map((doc: any) => {
              const id = doc.name.split("/").pop();
              const f = doc.fields || {};
              return {
                id,
                titulo: f.titulo?.stringValue || "Sem título",
                artista: f.artista?.stringValue || "Artista desconhecido",
                tomOriginal: f.tomOriginal?.stringValue || "C",
              };
            });
            setMusicasDisponiveis(lista);
          }
        }
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [repertorioId]);

  const toggleMusica = (musicaId: string) => {
    if (musicasSelecionadasIds.includes(musicaId)) {
      setMusicasSelecionadasIds(musicasSelecionadasIds.filter((id) => id !== musicaId));
    } else {
      setMusicasSelecionadasIds([...musicasSelecionadasIds, musicaId]);
    }
  };

  const handleSalvar = async () => {
    try {
      setSalvando(true);
      await serviceAtualizarRepertorio(repertorioId, {
        musicasIds: musicasSelecionadasIds,
      });
      router.push(`/repertorios/${repertorioId}`);
    } catch (erro: any) {
      console.error("Erro ao atualizar músicas do repertório:", erro);
      alert(erro.message || "Erro ao salvar músicas.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <p className="text-slate-400">A carregar músicas...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        <header className="flex items-center justify-between py-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/repertorios/${repertorioId}`}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-amber-400">Gerir Músicas</h1>
          </div>
          <span className="text-xs text-slate-400">
            {musicasSelecionadasIds.length} selecionadas
          </span>
        </header>

        <p className="text-xs text-slate-400 mb-4">
          Selecione as músicas que deseja incluir neste repertório:
        </p>

        {musicasDisponiveis.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
            <Music size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma música cadastrada no sistema.</p>
          </div>
        ) : (
          <div className="space-y-2 pb-20">
            {musicasDisponiveis.map((m) => {
              const selecionada = musicasSelecionadasIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  onClick={() => toggleMusica(m.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                    selecionada
                      ? "bg-amber-500/10 border-amber-400/50 text-slate-100"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{m.titulo}</p>
                    <p className="text-xs text-slate-400 truncate">{m.artista}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded text-xs border border-slate-700">
                      {m.tomOriginal}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        selecionada
                          ? "bg-amber-500 text-slate-950"
                          : "border border-slate-600 bg-slate-800"
                      }`}
                    >
                      {selecionada && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-4 pt-4 bg-slate-900/80 backdrop-blur">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold p-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
        >
          <Save size={18} />
          {salvando ? "A guardar..." : "Salvar Seleção"}
        </button>
      </div>
    </main>
  );
}