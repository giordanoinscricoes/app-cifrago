"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  List,
  X,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tomOriginal: string;
  cifra?: string;
}

const TONS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TONS_BEMOL = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function transporAcorde(acorde: string, semitons: number): string {
  if (!acorde) return acorde;

  const match = acorde.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return acorde;

  const raiz = match[1];
  const resto = match[2];

  let index = TONS.indexOf(raiz);
  if (index === -1) {
    index = TONS_BEMOL.indexOf(raiz);
  }
  if (index === -1) return acorde;

  let novoIndex = (index + semitons) % 12;
  if (novoIndex < 0) novoIndex += 12;

  return TONS[novoIndex] + resto;
}

function transporCifra(cifra: string, semitons: number): string {
  if (!cifra || semitons === 0) return cifra;

  const linhas = cifra.split("\n");

  return linhas
    .map((linha) => {
      if (!linha.trim()) return linha;

      if (linha.trim().startsWith("[") && linha.trim().endsWith("]")) {
        return linha;
      }

      const tokens = linha.trim().split(/\s+/);
      const todosSaoAcordes = tokens.every((token) => {
        return /^([A-G][b#]?)([mMaj0-9\(\)\/\+\#\-]*)$/.test(token);
      });

      if (todosSaoAcordes && (/\s{2,}/.test(linha) || tokens.length <= 6)) {
        return linha.replace(/([A-G][b#]?[mMaj0-9\(\)\/\+\#\-]*)/g, (match) => {
          if (!match.trim()) return match;
          const raizMatch = match.match(/^([A-G][b#]?)/);
          if (raizMatch && (TONS.includes(raizMatch[1]) || TONS_BEMOL.includes(raizMatch[1]))) {
            return transporAcorde(match, semitons);
          }
          return match;
        });
      }

      return linha;
    })
    .join("\n");
}

export default function ModoApresentacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: repertorioId } = use(params);

  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [indexAtual, setIndexAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [menuAberto, setMenuAberto] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  const [transposicoes, setTransposicoes] = useState<{ [key: number]: number }>({});

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(0.030); 
  const scrollRef = useRef<number | null>(null);

  const projectId = "app-cifras-bcdce";

  useEffect(() => {
    let wakeLock: any = null;
    async function solicitarWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
        }
      } catch (err) {
        console.error("Erro Wake Lock:", err);
      }
    }
    solicitarWakeLock();
    return () => {
      if (wakeLock !== null) wakeLock.release();
    };
  }, []);

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

  const mudarMusicaComReset = (novoIndex: number) => {
    setIsScrolling(false);
    setIndexAtual(novoIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    async function carregarApresentacao() {
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
          fRep.musicasIds?.arrayValue?.values?.map((v: any) => v.stringValue) || [];

        if (musicasIds.length === 0) {
          setCarregando(false);
          return;
        }

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
                cifra: f.cifra?.stringValue || "Cifra não cadastrada.",
              });
            });

            const listaOrdenada = musicasIds
              .map((id) => mapaMusicas.get(id))
              .filter(Boolean) as Musica[];

            setMusicas(listaOrdenada);
          }
        }
      } catch (erro) {
        console.error("Erro:", erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarApresentacao();
  }, [repertorioId]);

  const musicaAtual = musicas[indexAtual];
  const semitonsAtuais = transposicoes[indexAtual] || 0;

  const obterTomTransposto = () => {
    if (!musicaAtual) return "C";
    return transporAcorde(musicaAtual.tomOriginal, semitonsAtuais);
  };

  const alterarTom = (direcao: number) => {
    setTransposicoes((prev) => ({
      ...prev,
      [indexAtual]: (prev[indexAtual] || 0) + direcao,
    }));
  };

  const resetarTom = () => {
    setTransposicoes((prev) => ({
      ...prev,
      [indexAtual]: 0,
    }));
  };

  const proximaMusica = () => {
    if (indexAtual < musicas.length - 1) mudarMusicaComReset(indexAtual + 1);
  };

  const musicaAnterior = () => {
    if (indexAtual > 0) mudarMusicaComReset(indexAtual - 1);
  };

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
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <p className="text-amber-400 font-medium animate-pulse">A carregar...</p>
      </main>
    );
  }

  if (musicas.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto flex flex-col items-center justify-center text-center">
        <p className="text-slate-400 mb-4">Nenhuma música encontrada.</p>
        <Link href={`/repertorios/${repertorioId}`} className="text-amber-400 underline">
          Voltar
        </Link>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-slate-950 text-slate-100 pb-48 ${isScrolling ? "pt-4" : "pt-16"}`}>
      {/* Barra Superior Fixa (Oculta automaticamente quando o Play/isScrolling está ativo) */}
      <header 
        className={`fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-40 px-4 py-2.5 flex items-center justify-between transition-transform duration-300 ${
          isScrolling ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Link
            href={`/repertorios/${repertorioId}`}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 shrink-0"
            title="Voltar ao repertório"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="overflow-hidden">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block leading-tight">
              Música {indexAtual + 1} de {musicas.length}
            </span>
            <h1 className="text-sm font-bold text-slate-100 truncate leading-tight">
              {musicaAtual.titulo}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleFullScreen}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 rounded-lg transition"
          >
            {fullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button
            onClick={() => setMenuAberto(true)}
            className="p-2 bg-slate-800 text-amber-400 hover:bg-slate-700 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
          >
            <List size={18} />
            <span>Setlist</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="max-w-2xl mx-auto px-4 mt-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
          <div className="overflow-hidden">
            <h2 className="text-xl font-bold text-amber-400 truncate">
              {musicaAtual.titulo}
            </h2>
            <p className="text-sm text-slate-400 truncate">{musicaAtual.artista}</p>
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
          <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-200 font-medium">
            {transporCifra(musicaAtual.cifra || "", semitonsAtuais)}
          </pre>
        </div>
      </div>

      {/* Controlos Inferiores Fixos (Ocultam automaticamente quando o Play/isScrolling está ativo) */}
      <footer 
        className={`fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 z-40 space-y-2 transition-transform duration-300 ${
          isScrolling ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        
        {/* Controlo de Tom Fixo no Rodapé */}
        <div className="max-w-2xl mx-auto flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tom:</span>
            <span className="text-sm font-black text-amber-400 font-mono px-2 py-0.5 bg-slate-900 rounded border border-slate-800 min-w-[36px] text-center">
              {obterTomTransposto()}
            </span>
            {semitonsAtuais !== 0 && (
              <span className="text-[10px] text-slate-400 font-mono">
                (orig: {musicaAtual.tomOriginal})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {semitonsAtuais !== 0 && (
              <button
                onClick={resetarTom}
                className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition flex items-center gap-1 text-xs font-semibold"
                title="Voltar ao tom original"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Original</span>
              </button>
            )}
            <button
              onClick={() => alterarTom(-1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition active:scale-95"
              title="Baixar Tom"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={() => alterarTom(1)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition active:scale-95"
              title="Subir Tom"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Controlo de Auto-scroll com Slider */}
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

        {/* Navegação entre Músicas */}
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={musicaAnterior}
            disabled={indexAtual === 0}
            className="flex-1 py-2 px-4 bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold rounded-xl flex items-center justify-center gap-1 transition text-sm"
          >
            <ChevronLeft size={18} />
            <span>Anterior</span>
          </button>

          <span className="text-xs font-mono font-semibold text-slate-400 px-2 shrink-0">
            {indexAtual + 1} / {musicas.length}
          </span>

          <button
            onClick={proximaMusica}
            disabled={indexAtual === musicas.length - 1}
            className="flex-1 py-2 px-4 bg-amber-500 disabled:opacity-30 disabled:hover:bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1 transition text-sm shadow-md"
          >
            <span>Próxima</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>

      {/* Menu / Setlist */}
      {menuAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xs bg-slate-900 h-full p-4 flex flex-col justify-between shadow-2xl border-l border-slate-800">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="font-bold text-amber-400 text-base">
                  Setlist ({musicas.length})
                </h3>
                <button
                  onClick={() => setMenuAberto(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5 max-h-[75vh] overflow-y-auto pr-1">
                {musicas.map((m, i) => {
                  const tomTransp = transporAcorde(m.tomOriginal, transposicoes[i] || 0);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        mudarMusicaComReset(i);
                        setMenuAberto(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                        indexAtual === i
                          ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                          : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <p className="text-xs truncate">
                          {i + 1}. {m.titulo}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {m.artista}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-900 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700">
                        {tomTransp}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setMenuAberto(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </main>
  );
}