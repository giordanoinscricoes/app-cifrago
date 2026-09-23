"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, Minus, Music, RotateCcw, Play, Pause, Type, Maximize2, Minimize2 } from "lucide-react";
import { buscarMusicaPorIdAction } from "./actions";

// Importa as funções da matriz centralizada
import { transporCifra, transporNota } from "@/lib/cifras";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tomOriginal: string;
  cifra: string;
}

export default function VerMusicaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: musicaId } = use(params);

  const [musica, setMusica] = useState<Musica | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroMsg, setErroMsg] = useState("");

  const [semitonos, setSemitonos] = useState(0);
  const [tamanhoFonte, setTamanhoFonte] = useState(15);
  const [fullScreen, setFullScreen] = useState(false);

  // Estados para o Auto-scroll (Play)
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.030);
  const scrollRef = useRef<number | null>(null);

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

  // Lógica do Auto-scroll
  useEffect(() => {
    if (!isScrolling) {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
      return;
    }

    let lastTime = performance.now();
    let accumulatedPixels = 0;

    const step = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      accumulatedPixels += scrollSpeed * delta;

      if (accumulatedPixels >= 1) {
        const pixelsToScroll = Math.floor(accumulatedPixels);
        window.scrollBy({ top: pixelsToScroll, behavior: "auto" });
        accumulatedPixels -= pixelsToScroll;
      }

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
        setIsScrolling(false);
        return;
      }
      scrollRef.current = requestAnimationFrame(step);
    };

    scrollRef.current = requestAnimationFrame(step);
    return () => {
      if (scrollRef.current) cancelAnimationFrame(scrollRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreen(false);
      }
    }
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <p className="text-amber-400 font-medium animate-pulse">A carregar música...</p>
      </main>
    );
  }

  if (erroMsg || !musica) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{erroMsg || "Música não encontrada."}</p>
        <Link href="/musicas" className="text-amber-400 underline">
          Voltar para Músicas
        </Link>
      </main>
    );
  }

  const tomAtual = transporNota(musica.tomOriginal || "C", semitonos);
  const textoParaExibir = transporCifra(musica.cifra, semitonos);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-52 pt-16">
      {/* Barra Superior Fixa */}
      <header className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-40 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <Link
            href="/musicas"
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 shrink-0"
            title="Voltar para Músicas"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block leading-tight">
              Música Individual
            </span>
            <h1 className="text-sm font-bold text-slate-100 truncate leading-tight">
              {musica.titulo}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleFullScreen}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded-lg transition"
            title={fullScreen ? "Minimizar ecrã" : "Ecrã inteiro"}
          >
            {fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <Link
            href={`/musicas/${musica.id}/editar`}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
          >
            <Edit size={16} />
            <span>Editar</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-2xl mx-auto px-4 mt-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
          <div className="overflow-hidden">
            <h2 className="text-xl font-bold text-amber-400 truncate">
              {musica.titulo}
            </h2>
            <p className="text-sm text-slate-400 truncate">{musica.artista}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          {textoParaExibir ? (
            <pre
              style={{ fontSize: `${tamanhoFonte}px` }}
              className="font-mono leading-relaxed whitespace-pre-wrap break-words text-slate-200 font-medium transition-all duration-150"
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
        </div>
      </div>

      {/* Controlos Inferiores Fixos */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 z-40 space-y-2">
        
        {/* Barra Dividida em Duas Metades: Esquerda (Tom) e Direita (Tamanho da Fonte) */}
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2">
          
          {/* Metade Esquerda: Controlo de Tom */}
          <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Tom:</span>
              <span className="text-xs font-black text-amber-400 font-mono px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 text-center shrink-0">
                {tomAtual}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setSemitonos((prev) => prev - 1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition active:scale-95"
                title="Baixar Tom"
              >
                <Minus size={14} />
              </button>

              <button
                onClick={() => setSemitonos(0)}
                disabled={semitonos === 0}
                className={`p-1.5 rounded-lg transition active:scale-95 ${
                  semitonos === 0
                    ? "bg-slate-900/50 text-slate-600 cursor-not-allowed"
                    : "bg-slate-800 text-amber-400 hover:bg-slate-700"
                }`}
                title="Voltar ao tom original"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setSemitonos((prev) => prev + 1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition active:scale-95"
                title="Subir Tom"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Metade Direita: Controlo de Tamanho de Fonte */}
          <div className="flex items-center justify-between bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Type size={14} className="text-slate-400 shrink-0" />
              <span className="text-xs font-mono font-bold text-amber-400 shrink-0">{tamanhoFonte}px</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setTamanhoFonte((prev) => Math.max(10, prev - 1))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition active:scale-95"
                title="Diminuir Fonte"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setTamanhoFonte((prev) => Math.min(32, prev + 1))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition active:scale-95"
                title="Aumentar Fonte"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

        </div>

        {/* Controlo de Auto-scroll com Slider (Play) */}
        <div className="max-w-2xl mx-auto bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setIsScrolling(!isScrolling)}
              className={`py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 text-xs transition shrink-0 ${
                isScrolling
                  ? "bg-amber-500 text-slate-950 shadow-md animate-pulse"
                  : "bg-slate-800 text-amber-400 hover:bg-slate-700"
              }`}
            >
              {isScrolling ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              <span>{isScrolling ? "A rolar" : "Play"}</span>
            </button>

            <div className="flex-1 flex flex-col justify-center px-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Lento</span>
                <span className="text-amber-400 font-mono">Velocidade</span>
                <span>Rápido</span>
              </div>
              <input
                type="range"
                min="0.003"
                max="0.25"
                step="0.002"
                value={scrollSpeed}
                onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

      </footer>
    </main>
  );
}