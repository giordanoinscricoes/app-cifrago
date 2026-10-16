"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, GripVertical, Edit, Trash2, Music, Search, Loader2, Share2, X, Check, FileText } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getUserRole, getPermissions, UserPermissions, isAdmin } from "@/lib/auth";
import { serviceGetMusicas, serviceDeletarMusica } from "@/lib/firebase-functions";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { salvarOrdemMusicasAction } from "./actions";
import jsPDF from "jspdf";

interface Musica {
  id: string;
  titulo: string;
  artista: string;
  tomOriginal: string;
  ordem?: number;
  userId: string;
  criadoPor?: string;
  compartilhadoCom?: string[];
  cifra?: string;
}

export default function MusicasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  // Estados para o Modal de Partilha
  const [musicaParaPartilhar, setMusicaParaPartilhar] = useState<Musica | null>(null);
  const [emailDestinatario, setEmailDestinatario] = useState("");
  const [aPartilhar, setAPartilhar] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [itemArrastado, setItemArrastado] = useState<number | null>(null);

  const [aGerarPdf, setAGerarPdf] = useState(false);

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

        // 2. Carrega as músicas
        await carregarMusicas(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const carregarMusicas = async (currentUser: User) => {
    try {
      setCarregando(true);
      const lista = await serviceGetMusicas();
      const emailUser = currentUser.email?.toLowerCase() || "";
      const admin = isAdmin(currentUser);
      
      const musicasFormatadas: Musica[] = [];

      lista.forEach((item: any) => {
        const criadoPor = (item.criadoPor || item.email || "").toLowerCase();
        const compartilhadoCom = (item.compartilhadoCom || []).map((e: string) => e.toLowerCase());

        // Regra de visualização: Admin vê tudo, utilizador comum vê as suas ou as partilhadas com ele
        const eDono = criadoPor === emailUser || item.userId === currentUser.uid;
        const eCompartilhado = compartilhadoCom.includes(emailUser);

        if (admin || eDono || eCompartilhado) {
          musicasFormatadas.push({
            id: item.id,
            titulo: item.titulo || "Sem título",
            artista: item.artista || "Artista desconhecido",
            tomOriginal: item.tomOriginal || "C",
            ordem: item.ordem ?? 0,
            userId: item.userId,
            criadoPor: item.criadoPor || item.email || "",
            compartilhadoCom: item.compartilhadoCom || [],
            cifra: item.cifra || item.letra || "",
          });
        }
      });

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

  const handleExcluir = async (id: string, titulo: string, donoId: string, criadoPor?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const éAdmin = isAdmin(user);
    const éDono = user && (user.uid === donoId || user.email === criadoPor);

    if (!éAdmin && !éDono) {
      alert("Apenas o criador original pode eliminar esta música.");
      return;
    }

    if (confirm(`Tem certeza de que deseja eliminar a música "${titulo}"?`)) {
      try {
        await serviceDeletarMusica(id, donoId);
        setMusicas((prev) => prev.filter((m) => m.id !== id));
      } catch (erro: any) {
        alert(erro.message || "Erro ao eliminar música.");
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

  const handlePartilharPDF = async () => {
    if (!musicaParaPartilhar) return;

    try {
      setAGerarPdf(true);

      const docPdf = new jsPDF();
      
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(18);
      docPdf.text(musicaParaPartilhar.titulo, 14, 20);

      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(11);
      docPdf.setTextColor(100);
      docPdf.text(`Artista: ${musicaParaPartilhar.artista} | Tom: ${musicaParaPartilhar.tomOriginal}`, 14, 28);

      docPdf.setLineWidth(0.5);
      docPdf.setDrawColor(200, 200, 200);
      docPdf.line(14, 34, 196, 34);

      docPdf.setFont("courier", "normal");
      docPdf.setFontSize(9);
      docPdf.setTextColor(40, 40, 40);

      const linhasLetra = docPdf.splitTextToSize(musicaParaPartilhar.cifra || "", 180);
      docPdf.text(linhasLetra, 14, 44);

      const pdfBlob = docPdf.output("blob");
      const pdfFile = new File([pdfBlob], `${musicaParaPartilhar.titulo} - ${musicaParaPartilhar.artista}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: musicaParaPartilhar.titulo,
          text: `Segue a cifra: ${musicaParaPartilhar.titulo} - ${musicaParaPartilhar.artista}`,
          files: [pdfFile],
        });
      } else {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `${musicaParaPartilhar.titulo}.pdf`;
        link.click();

        const mensagem = encodeURIComponent(`Olá! Segue em anexo a cifra da música "${musicaParaPartilhar.titulo}" (${musicaParaPartilhar.artista}).`);
        window.open(`https://api.whatsapp.com/send?text=${mensagem}`, "_blank");
      }

      setMusicaParaPartilhar(null);
    } catch (erro) {
      console.error("Erro ao gerar PDF da música:", erro);
      alert("Não foi possível gerar o PDF da música.");
    } finally {
      setAGerarPdf(false);
    }
  };

  const musicasFiltradas = musicas.filter(
    (m) =>
      m.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      m.artista.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-amber-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">A carregar músicas...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 w-full flex flex-col justify-between">
      <div className="w-full max-w-4xl mx-auto flex-1">
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
                const ePartilhado = !isAdmin(user) && m.criadoPor && user?.email && m.criadoPor.toLowerCase() !== user.email.toLowerCase();

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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/musicas/${m.id}`}
                          className="font-semibold text-slate-100 hover:text-amber-400 transition truncate block"
                        >
                          {m.titulo}
                        </Link>
                        {ePartilhado && (
                          <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium shrink-0">
                            Partilhado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{m.artista}</p>
                    </div>

                    {/* Tom e Botões de Ação */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 font-bold px-2 py-0.5 rounded text-xs">
                        {m.tomOriginal}
                      </span>

                      {/* Botão de Partilha */}
                      <button
                        onClick={() => setMusicaParaPartilhar(m)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded transition"
                        title="Partilhar Música"
                      >
                        <Share2 size={16} />
                      </button>

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
                            onClick={(e) => handleExcluir(m.id, m.titulo, m.userId, m.criadoPor, e)}
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
              Partilhar <strong className="text-slate-100">{musicaParaPartilhar.titulo}</strong>:
            </p>

            <div className="space-y-3 pt-1">
              {/* Botão de PDF / WhatsApp */}
              <button
                onClick={handlePartilharPDF}
                disabled={aGerarPdf}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow"
              >
                <FileText size={16} />
                <span>{aGerarPdf ? "A gerar PDF..." : "Partilhar PDF / WhatsApp"}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-wider">ou</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Partilha por E-mail */}
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
                  <div className="flex justify-end gap-2 pt-1">
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
                      <span>Partilhar Acesso</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}