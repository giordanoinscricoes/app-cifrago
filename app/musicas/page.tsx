"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, GripVertical, Edit, Trash2, Music, Search, Loader2 } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserRole, getPermissions, UserPermissions } from "@/lib/auth";
import { serviceGetMusicas, serviceDeletarMusica } from "@/lib/firebase-functions";
import { salvarOrdemMusicasAction } from "./actions";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tomOriginal: string;
  ordem?: number;
  userId: string;
}

export default function MusicasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [itemArrastado, setItemArrastado] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        
        // 1. Descobre as permissões do utilizador logado
        const role = await getUserRole(currentUser);
        const userPerms = getPermissions(role);
        setPermissions(userPerms);

        // 2. Carrega as músicas utilizando a função centralizada
        await carregarMusicas();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const carregarMusicas = async () => {
    try {
      setCarregando(true);
      const lista = await serviceGetMusicas();
      
      const musicasFormatadas: Musica[] = lista.map((item: any) => ({
        id: item.id,
        titulo: item.titulo || "Sem título",
        artista: item.artista || "Artista desconhecido",
        tomOriginal: item.tomOriginal || "C",
        ordem: item.ordem ?? 0,
        userId: item.userId,
      }));

      musicasFormatadas.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      setMusicas(musicasFormatadas);
    } catch (erro) {
      console.error("Erro ao carregar músicas:", erro);
    } finally {
      setCarregando(false);
    }
  };

  // Lógica de Arrastar e Reordenar
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
      const novaLista = [...musicas];
      const itemMovido = novaLista.splice(dragItem.current, 1)[0];
      novaLista.splice(dragOverItem.current, 0, itemMovido);

      setMusicas(novaLista);

      setSalvandoOrdem(true);
      await salvarOrdemMusicasAction(novaLista);
      setSalvandoOrdem(false);
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setItemArrastado(null);
  };

  const handleExcluir = async (id: string, titulo: string, donoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Tem certeza de que deseja eliminar a música "${titulo}"?`)) {
      try {
        await serviceDeletarMusica(id, donoId);
        setMusicas((prev) => prev.filter((m) => m.id !== id));
      } catch (erro: any) {
        alert(erro.message || "Erro ao eliminar música.");
      }
    }
  };

  const musicasFiltradas = musicas.filter(
    (m) =>
      m.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      m.artista.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="flex items-center gap-2 text-amber-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">A carregar músicas...</p>
        </div>
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
              href="/"
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-xl font-bold text-amber-400">Músicas</h1>
          </div>

          {/* Só mostra o botão de Nova Música se tiver permissão de modificação */}
          {permissions?.canModifyContent && (
            <Link
              href="/musicas/nova"
              className="p-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full transition shadow-lg"
              title="Nova Música"
            >
              <Plus size={20} />
            </Link>
          )}
        </header>

        {/* Campo de Pesquisa */}
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

        {/* Lista de Músicas com Arraste */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Catálogo de Músicas ({musicasFiltradas.length})
            </p>
            {salvandoOrdem && (
              <span className="text-[10px] text-amber-400 animate-pulse font-mono">
                A guardar ordem...
              </span>
            )}
          </div>

          {musicasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-3">
              <Music size={36} className="mx-auto opacity-40" />
              <p className="text-sm">Ainda não tens nenhuma música guardada.</p>
              {permissions?.canModifyContent && (
                <Link 
                  href="/musicas/nova"
                  className="inline-block text-xs text-amber-400 font-semibold hover:underline"
                >
                  Criar a primeira música
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {musicasFiltradas.map((m, index) => {
                const modoBuscaAtivo = termoBusca.trim().length > 0;

                return (
                  <div
                    key={m.id}
                    draggable={!modoBuscaAtivo}
                    onDragStart={() => !modoBuscaAtivo && handleDragStart(index)}
                    onDragEnter={() => !modoBuscaAtivo && handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`bg-slate-800 p-3.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                      !modoBuscaAtivo ? "cursor-grab active:cursor-grabbing" : ""
                    } ${
                      itemArrastado === index
                        ? "border-amber-400 opacity-40 bg-slate-700/50"
                        : "border-slate-700/60 hover:border-slate-600"
                    }`}
                  >
                    {/* Ícone Indicador de Arraste */}
                    <div
                      className={`p-1 shrink-0 ${
                        modoBuscaAtivo
                          ? "text-slate-700 cursor-not-allowed"
                          : "text-slate-500 hover:text-amber-400"
                      }`}
                    >
                      <GripVertical size={18} />
                    </div>

                    {/* Informações da Música */}
                    <div className="flex-1 overflow-hidden pr-2">
                      <Link
                        href={`/musicas/${m.id}`}
                        className="font-semibold text-slate-100 hover:text-amber-400 transition truncate block"
                      >
                        {m.titulo}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">{m.artista}</p>
                    </div>

                    {/* Tom e Botões de Ação */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold px-2 py-0.5 rounded text-xs">
                        {m.tomOriginal}
                      </span>

                      {/* Botões de Edição e Exclusão restritos a quem pode modificar */}
                      {permissions?.canModifyContent && (
                        <>
                          <Link
                            href={`/musicas/${m.id}/editar`}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded transition"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={(e) => handleExcluir(m.id, m.titulo, m.userId, e)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}