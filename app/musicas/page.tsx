"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Music as MusicIcon, Edit, Trash2, Share2, Loader2, X, Check } from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { collection, getDocs, doc, deleteDoc, updateDoc, arrayUnion, query, where, or } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isAdmin } from "@/lib/auth";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tom: string;
  cifra: string;
  criadoPor?: string;
  compartilhadoCom?: string[];
}

export default function MusicasPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [termoPesquisa, setTermoPesquisa] = useState("");

  // Estado para o Modal de Partilha
  const [musicaParaPartilhar, setMusicaParaPartilhar] = useState<Musica | null>(null);
  const [emailDestinatario, setEmailDestinatario] = useState("");
  const [aPartilhar, setAPartilhar] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        await carregarMusicas(currentUser);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, [router]);

  const carregarMusicas = async (currentUser: FirebaseUser) => {
    try {
      setCarregando(true);
      let querySnapshot;

      // Se for admin, busca todas as músicas da base de dados de forma global
      if (isAdmin(currentUser)) {
        querySnapshot = await getDocs(collection(db, "musicas"));
      } else {
        // Caso contrário, busca as criadas pelo próprio utilizador OU partilhadas com ele
        const emailUser = currentUser.email || "";
        const q = query(
          collection(db, "musicas"),
          or(
            where("criadoPor", "==", emailUser),
            where("compartilhadoCom", "array-contains", emailUser)
          )
        );
        querySnapshot = await getDocs(q);
      }

      const lista: Musica[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        lista.push({
          id: docSnap.id,
          titulo: data.titulo || "Sem título",
          artista: data.artista || "Desconhecido",
          tom: data.tom || "",
          cifra: data.cifra || "",
          criadoPor: data.criadoPor || "",
          compartilhadoCom: data.compartilhadoCom || [],
        });
      });

      setMusicas(lista);
    } catch (erro) {
      console.error("Erro ao carregar músicas:", erro);
    } finally {
      setCarregando(false);
    }
  };

  const apagarMusica = async (id: string, criadoPor?: string) => {
    // Admin pode apagar qualquer música, utilizador comum apenas as suas
    if (!isAdmin(user) && criadoPor && user?.email && criadoPor !== user.email) {
      alert("Apenas o criador original pode apagar esta música.");
      return;
    }

    if (confirm("Tem certeza que deseja apagar esta música?")) {
      try {
        await deleteDoc(doc(db, "musicas", id));
        setMusicas((prev) => prev.filter((m) => m.id !== id));
      } catch (erro) {
        console.error("Erro ao apagar música:", erro);
        alert("Erro ao apagar a música.");
      }
    }
  };

  const handlePartilhar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicaParaPartilhar || !emailDestinatario.trim()) return;

    try {
      setAPartilhar(true);
      const musicaRef = doc(db, "musicas", musicaParaPartilhar.id);
      
      await updateDoc(musicaRef, {
        compartilhadoCom: arrayUnion(emailDestinatario.trim().toLowerCase()),
      });

      setMensagemSucesso("Música partilhada com sucesso!");
      setEmailDestinatario("");
      setTimeout(() => {
        setMensagemSucesso("");
        setMusicaParaPartilhar(null);
        if (user) carregarMusicas(user);
      }, 1500);
    } catch (erro) {
      console.error("Erro ao partilhar música:", erro);
      alert("Erro ao partilhar música. Verifique o e-mail.");
    } finally {
      setAPartilhar(false);
    }
  };

  const musicasFiltradas = musicas.filter(
    (m) =>
      m.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
      m.artista.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  if (carregando && musicas.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-xl mx-auto flex flex-col justify-between">
      <div>
        {/* Cabeçalho */}
        <header className="flex items-center justify-between py-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 text-slate-300 transition border border-slate-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <MusicIcon className="text-amber-400" size={24} />
              <h1 className="text-xl font-bold text-amber-400">Catálogo de Músicas</h1>
            </div>
          </div>
          <Link
            href="/musicas/novo"
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-lg"
          >
            <Plus size={16} />
            <span>Nova Música</span>
          </Link>
        </header>

        {/* Barra de Pesquisa */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Pesquisar por título ou artista..."
            value={termoPesquisa}
            onChange={(e) => setTermoPesquisa(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Lista de Músicas */}
        <div className="space-y-3">
          {musicasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-sm">Nenhuma música encontrada.</p>
            </div>
          ) : (
            musicasFiltradas.map((m) => {
              const ePartilhado = !isAdmin(user) && m.criadoPor && user?.email && m.criadoPor !== user.email;

              return (
                <div
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md hover:border-slate-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-slate-100 truncate">{m.titulo}</h2>
                      {ePartilhado && (
                        <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium shrink-0">
                          Partilhado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{m.artista}</p>
                    {m.tom && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[11px] font-mono text-amber-400">
                        Tom: {m.tom}
                      </span>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setMusicaParaPartilhar(m)}
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl transition border border-slate-800"
                      title="Partilhar Música"
                    >
                      <Share2 size={16} />
                    </button>
                    <Link
                      href={`/musicas/${m.id}`}
                      className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-xl transition border border-slate-800"
                      title="Editar / Ver Cifra"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => apagarMusica(m.id, m.criadoPor)}
                      className="p-2 bg-slate-950 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition border border-slate-800"
                      title="Apagar Música"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Partilha */}
      {musicaParaPartilhar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                <Share2 size={18} /> Partilhar Música
              </h3>
              <button
                onClick={() => setMusicaParaPartilhar(null)}
                className="text-slate-400 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Partilhar <strong className="text-slate-100">{musicaParaPartilhar.titulo}</strong> com outro utilizador:
            </p>

            {mensagemSucesso ? (
              <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
                <Check size={16} /> <span>{mensagemSucesso}</span>
              </div>
            ) : (
              <form onSubmit={handlePartilhar} className="space-y-3">
                <input
                  type="email"
                  placeholder="E-mail do destinatário"
                  value={emailDestinatario}
                  onChange={(e) => setEmailDestinatario(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMusicaParaPartilhar(null)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={aPartilhar}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {aPartilhar ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
                    <span>Partilhar</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}