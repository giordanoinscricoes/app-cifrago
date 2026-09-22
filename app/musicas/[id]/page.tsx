"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, Minus, Type, Music, RotateCcw } from "lucide-react";
import { buscarMusicaPorIdAction } from "./actions";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tomOriginal: string;
  cifra: string;
}

const NOTAS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function transporNota(nota: string, semitones: number): string {
  let n = nota.trim().toUpperCase();
  if (n === "DB") n = "C#";
  if (n === "EB") n = "D#";
  if (n === "GB") n = "F#";
  if (n === "AB") n = "G#";
  if (n === "BB") n = "A#";

  const idx = NOTAS.indexOf(n);
  if (idx === -1) return nota;

  let novoIdx = (idx + semitones) % 12;
  if (novoIdx < 0) novoIdx += 12;
  return NOTAS[novoIdx];
}

function transporCifraSimples(texto: string, semitones: number): string {
  if (semitones === 0 || !texto) return texto;

  // Substitui os acordes base mantendo o texto intacto
  return texto.replace(/\b([A-G][#b]?)(m|maj|min|dim|aug|sus\d?|\d)*(?:\/([A-G][#b]?))?\b/g, 
    (match, notaBase, sufixo = "", baixo) => {
      const novaBase = transporNota(notaBase, semitones);
      const novoBaixo = baixo ? "/" + transporNota(baixo, semitones) : "";
      return `${novaBase}${sufixo}${novoBaixo}`;
    }
  );
}

export default function VerMusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: musicaId } = use(params);

  const [musica, setMusica] = useState<Musica | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroMsg, setErroMsg] = useState("");

  const [semitonos, setSemitonos] = useState(0);
  const [tamanhoFonte, setTamanhoFonte] = useState(15);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      setErroMsg("");
      const res = await buscarMusicaPorIdAction(musicaId);
      if (res.sucesso && res.musica) {
        setMusica(res.musica);
      } else {
        setErroMsg(res.erro || "Erro ao carregar música.");
      }
      setCarregando(false);
    }

    carregar();
  }, [musicaId]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <p className="text-slate-400">A carregar música...</p>
      </main>
    );
  }

  if (erroMsg || !musica) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{erroMsg || "Música não encontrada."}</p>
        <Link href="/musicas" className="text-amber-400 underline">
          Voltar para Músicas
        </Link>
      </main>
    );
  }

  const tomAtual = transporNota(musica.tomOriginal || "C", semitonos);
  const textoParaExibir = transporCifraSimples(musica.cifra, semitonos);

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex flex-col justify-between">
      <div>
        {/* Cabeçalho */}
        <header className="flex items-center justify-between py-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/musicas"
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-amber-400 truncate max-w-[200px]">
                {musica.titulo}
              </h1>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">
                {musica.artista}
              </p>
            </div>
          </div>

          <Link
            href={`/musicas/${musica.id}/editar`}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full transition border border-slate-700"
            title="Editar Música"
          >
            <Edit size={18} />
          </Link>
        </header>

        {/* Barra de Ferramentas: Tom e Tamanho da Fonte */}
        <section className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/60 mb-6 flex items-center justify-between gap-1">
          {/* Controlo de Tom */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 font-medium">Tom:</span>
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setSemitonos((prev) => prev - 1)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                title="Baixar tom (-1)"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setSemitonos(0)}
                className={`px-1.5 font-bold text-sm min-w-[1.8rem] text-center transition ${
                  semitonos !== 0 ? "text-amber-400 hover:underline" : "text-amber-400"
                }`}
                title="Clique para voltar ao tom original"
              >
                {tomAtual}
              </button>
              <button
                onClick={() => setSemitonos((prev) => prev + 1)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                title="Aumentar tom (+1)"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Ícone de Reset caso o tom tenha sido alterado */}
            {semitonos !== 0 && (
              <button
                onClick={() => setSemitonos(0)}
                className="p-1.5 text-amber-400 hover:bg-slate-700/50 rounded-lg transition"
                title="Voltar ao tom original"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          {/* Controlo de Tamanho de Fonte */}
          <div className="flex items-center gap-1">
            <Type size={15} className="text-slate-400" />
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setTamanhoFonte((prev) => Math.max(10, prev - 1))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                title="Diminuir Fonte"
              >
                <Minus size={14} />
              </button>
              <span className="px-1 font-mono text-xs text-slate-300 font-bold min-w-[1.8rem] text-center">
                {tamanhoFonte}px
              </span>
              <button
                onClick={() => setTamanhoFonte((prev) => Math.min(32, prev + 1))}
                className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition"
                title="Aumentar Fonte"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Exibição da Cifra/Letra */}
        <section className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto min-h-[200px]">
          {textoParaExibir ? (
            <pre
              style={{ fontSize: `${tamanhoFonte}px` }}
              className="font-mono leading-relaxed text-slate-200 whitespace-pre-wrap select-text text-left transition-all duration-150"
            >
              {textoParaExibir}
            </pre>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Music size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma cifra/letra cadastrada para esta música.</p>
              <Link
                href={`/musicas/${musica.id}/editar`}
                className="mt-3 text-xs text-amber-400 font-semibold underline block"
              >
                + Adicionar Cifra
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}