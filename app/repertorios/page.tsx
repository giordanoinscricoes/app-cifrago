"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, GripVertical, Edit, Trash2, ChevronRight, Music, Search, Loader2 } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserRole, getPermissions, UserPermissions } from "@/lib/auth";
import { serviceGetRepertorios, serviceDeletarRepertorio } from "@/lib/firebase-functions";
import { salvarOrdemRepertoriosAction } from "./actions";

interface Repertorio {
  id: string;
  titulo: string;
  descricao: string;
  totalMusicas: number;
  ordem?: number;
  userId: string;
}

export default function RepertoriosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
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
        
        // 1. Obtém as permissões do utilizador
        const role = await getUserRole(currentUser);
        const userPerms = getPermissions(role);
        setPermissions(userPerms);

        // 2. Carrega os repertórios através do serviço centralizado
        await carregarRepertorios();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const carregarRepertorios = async () => {
    try {
      setCarregando(true);
      const lista = await serviceGetRepertorios();
      
      const repertoriosFormatados: Repertorio[] = lista.map((data: any) => {
        const musicasIds = data.musicasIds || [];
        return {
          id: data.id,
          titulo: data.titulo || "Sem título",
          descricao: data.descricao || "",
          totalMusicas: musicasIds.length,
          ordem: data.ordem ?? 0,
          userId: data.userId,
        };
      });

      repertoriosFormatados.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      setRepertorios(repertoriosFormatados);
    } catch (erro) {
      console.error("Erro ao carregar repertórios:", erro);
    } finally {
      setCarregando(false);
    }
  };
  
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
      const novaLista = [...repertorios];
      const itemMovido = novaLista.splice(dragItem.current, 1)[0];
      novaLista.splice(dragOverItem.current, 0, itemMovido);

      setRepertorios(novaLista);

      setSalvandoOrdem(true);
      await salvarOrdemRepertoriosAction(novaLista);
      setSalvandoOrdem(false);
    }

    dragItem.current = null;
    dragOverItem.current = null;
    setItemArrastado(null);
  };

  const handleExcluir = async (id: string, titulo: string, donoId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Tem certeza de que deseja eliminar o repertório "${titulo}"?`)) {
      try {
        await serviceDeletarRepertorio(id, donoId);
        setRepertorios((prev) => prev.filter((r) => r.id !== id));
      } catch (erro: any) {
        alert(erro.message || "Erro ao eliminar repertório.");
      }
    }
  };

  const repertoriosFiltrados = repertorios.filter(
    (r) =>
      r.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      r.descricao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 max-w-md mx-auto flex items-center justify-center">
        <div className="flex items-center gap-2 text-amber-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">A carregar repertórios...</p>
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
            <h1 className="text-xl font-bold text-amber-400">Repertórios</h1>
          </div>

          {permissions?.canModifyContent && (
            <Link
              href="/repertorios/novo"
              className="p-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full transition shadow-lg"
              title="Novo Repertório"
            >
              <Plus size={20} />
            </Link>
          )}
        </header>

        {/* Pesquisa */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar por título ou descrição..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-400 placeholder:text-slate-500"
          />
        </div>

        {/* Lista de Repertórios */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Todos os Repertórios ({repertoriosFiltrados.length})
            </p>
            {salvandoOrdem && (
              <span className="text-[10px] text-amber-400 animate-pulse font-mono">
                A guardar ordem...
              </span>
            )}
          </div>

          {repertoriosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              <Music size={36} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum repertório encontrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {repertoriosFiltrados.map((r, index) => {
                const modoBuscaAtivo = termoBusca.trim().length > 0;

                return (
                  <div
                    key={r.id}
                    draggable={!modoBuscaAtivo}
                    onDragStart={() => !modoBuscaAtivo && handleDragStart(index)}
                    onDragEnter={() => !modoBuscaAtivo && handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={`bg-slate-800/80 p-4 rounded-xl border flex items-center justify-between gap-3 transition ${
                      !modoBuscaAtivo ? "cursor-grab active:cursor-grabbing" : ""
                    } ${
                      itemArrastado === index
                        ? "border-amber-400 opacity-40 bg-slate-700/50"
                        : "border-slate-700/60 hover:border-slate-600"
                    }`}
                  >
                    <div
                      className={`shrink-0 ${
                        modoBuscaAtivo
                          ? "text-slate-700 cursor-not-allowed"
                          : "text-slate-500 hover:text-amber-400"
                      }`}
                    >
                      <GripVertical size={20} />
                    </div>

                    <Link
                      href={`/repertorios/${r.id}`}
                      className="flex-1 overflow-hidden"
                    >
                      <h2 className="font-bold text-slate-100 truncate text-base hover:text-amber-400 transition mb-0.5">
                        {r.titulo}
                      </h2>
                      {r.descricao && (
                        <p className="text-xs text-slate-400 truncate mb-1">
                          {r.descricao}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 italic">
                        {r.totalMusicas === 0
                          ? "Nenhuma música adicionada"
                          : `${r.totalMusicas} ${
                              r.totalMusicas === 1 ? "música" : "músicas"
                            }`}
                      </p>
                    </Link>

                    <div className="flex items-center gap-1 shrink-0">
                      {permissions?.canModifyContent && (
                        <>
                          <Link
                            href={`/repertorios/${r.id}/editar`}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={(e) => handleExcluir(r.id, r.titulo, r.userId, e)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <Link
                        href={`/repertorios/${r.id}`}
                        className="p-1.5 text-slate-500 hover:text-slate-200 transition"
                      >
                        <ChevronRight size={18} />
                      </Link>
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