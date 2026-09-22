"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, GripVertical, Trash2, Edit, Music, ChevronRight, Play } from "lucide-react";
import {
  removerMusicaDoRepertorioAction,
  reordenarMusicasDoRepertorioAction,
} from "./actions";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tomOriginal: string;
}

interface Repertorio {
  id: string;
  titulo: string;
  descricao: string;
  musicasIds: string[];
}

export default function DetalhesRepertorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: repertorioId } = use(params);

  const [repertorio, setRepertorio] = useState<Repertorio | null>(null);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [itemArrastado, setItemArrastado] = useState<number | null>(null);

  const projectId = "app-cifras-bcdce";

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);

        const resRep = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/repertorios/${repertorioId}`,
          { cache: "no-store" }
        );

        if (!resRep.ok) return;

        const docRep = await resRep.json();
        const fRep = docRep.fields || {};
        const musicasIds: string[] =
          fRep.musicasIds?.arrayValue?.values?.map(
            (v: any) => v.stringValue
          ) || [];

        setRepertorio({
          id: repertorioId,
          titulo: fRep.titulo?.stringValue || "Sem título",
          descricao: fRep.descricao?.stringValue || "",
          musicasIds,
        });

        const resMusicas = await fetch(
          `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas`,
          { cache: "no-store" }
        );

        if (resMusicas.ok) {
          const dadosMusicas = await resMusicas.json();
          if (dadosMusicas.documents) {
            const mapaMusicas = new Map<string, Musica>();
            dadosMusicas.documents.forEach((doc: any) => {
              const id = doc.name.split("/").pop();
              const f = doc.fields || {};
              mapaMusicas.set(id, {
                id,
                titulo: f.titulo?.stringValue || "Sem título",
                artista: f.artista?.stringValue || "Artista desconhecido",
                tomOriginal: f.tomOriginal?.stringValue || "C",
              });
            });

            const listaOrdenada = musicasIds
              .map((id) => mapaMusicas.get(id))
              .filter(Boolean) as Musica[];

            setMusicas(listaOrdenada);
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

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setItemArrastado(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      const novalist = [...musicas];
      const itemMovido = novalist.splice(dragItem.current, 1)[0];
      novalist.splice(dragOverItem.current, 0, itemMovido);

      setMusicas(novalist);

      const novosIds = novalist.map((m) => m.id);
      setSalvandoOrdem(true);
      try {
        await reordenarMusicasDoRepertorioAction(repertorioId, novosIds);
      } catch (err) {
        console.error("Erro ao salvar ordem:", err);
      } finally {
        setSalvandoOrdem(false);
      }
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setItemArrastado(null);
  };

  const handleRemoverMusica = async (musicaId: string, titulo: string) => {
    if (confirm(`Remover "${titulo}" deste repertório?`)) {
      const novasList = musicas.filter((m) => m.id !== musicaId);
      setMusicas(novasList);
      await removerMusicaDoRepertorioAction(repertorioId, musicaId);
    }
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <p className="text-slate-400">A carregar repertório...</p>
      </main>
    );
  }

  if (!repertorio) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto">
        <p className="text-red-400">Repertório não encontrado.</p>
        <Link href="/repertorios" className="text-amber-400 underline mt-4 block">
          Voltar para Repertórios
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        {/* Cabeçalho */}
        <header className="flex items-center justify-between py-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <Link
              href="/repertorios"
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition shrink-0"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-amber-400 leading-tight truncate">
                {repertorio.titulo}
              </h1>
            </div>
          </div>

          <Link
            href={`/repertorios/${repertorio.id}/editar`}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition shrink-0"
            title="Editar Repertório"
          >
            <Edit size={18} />
          </Link>
        </header>

        {repertorio.descricao && (
          <p className="text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800 mb-4">
            {repertorio.descricao}
          </p>
        )}

        {/* Lista de Músicas com Arraste */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Músicas ({musicas.length})
            </p>
            {salvandoOrdem && (
              <span className="text-[10px] text-amber-400 animate-pulse font-mono">
                A guardar nova ordem...
              </span>
            )}
          </div>

          {musicas.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <Music size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma música neste repertório.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {musicas.map((m, index) => (
                <div
                  key={m.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`bg-slate-800 p-3.5 rounded-xl border flex items-center justify-between gap-2 transition cursor-grab active:cursor-grabbing ${
                    itemArrastado === index
                      ? "border-amber-400 opacity-40 bg-slate-700/50"
                      : "border-slate-700/60 hover:border-slate-600"
                  }`}
                >
                  <div className="p-1 text-slate-500 hover:text-amber-400 shrink-0">
                    <GripVertical size={18} />
                  </div>

                  <div className="flex-1 overflow-hidden pr-2">
                    <Link
                      href={`/musicas/${m.id}`}
                      className="font-semibold text-slate-100 hover:text-amber-400 transition truncate block text-sm"
                    >
                      {index + 1}. {m.titulo}
                    </Link>
                    <p className="text-xs text-slate-400 truncate">{m.artista}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold px-2 py-0.5 rounded text-xs">
                      {m.tomOriginal}
                    </span>
                    <button
                      onClick={() => handleRemoverMusica(m.id, m.titulo)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                      title="Remover do Repertório"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Link
                      href={`/musicas/${m.id}`}
                      className="p-1 text-slate-500 hover:text-slate-200 transition"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Botões de Ação Fixos */}
      <div className="sticky bottom-4 pt-4 flex gap-2">
        <Link
          href={`/repertorios/${repertorio.id}/apresentacao`}
          className={`flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold p-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg transition ${
            musicas.length === 0 ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Play size={20} fill="currentColor" />
          <span>Iniciar Show</span>
        </Link>

        <Link
          href={`/repertorios/${repertorio.id}/selecionar-musicas`}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-3.5 rounded-xl flex items-center justify-center transition shrink-0"
          title="Gerir / Adicionar Músicas"
        >
          <Plus size={20} />
        </Link>
      </div>
    </main>
  );
}