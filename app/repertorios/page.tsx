"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, GripVertical, Edit, Trash2, ChevronRight, FolderKanban, Search, Loader2, Share2, FileText, X, Check } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { getUserRole, getPermissions, UserPermissions, isAdmin } from "@/lib/auth";
import { serviceGetRepertorios, serviceDeletarRepertorio } from "@/lib/firebase-functions";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { salvarOrdemRepertoriosAction } from "./actions";
import jsPDF from "jspdf";

interface Repertorio {
  id: string;
  titulo: string;
  descricao: string;
  totalMusicas: number;
  ordem?: number;
  userId: string;
  criadoPor?: string;
  compartilhadoCom?: string[];
  musicasIds?: string[];
}

export default function RepertoriosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [repertorios, setRepertorios] = useState<Repertorio[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvandoOrdem, setSalvandoOrdem] = useState(false);

  // Estados para o Modal de Partilha
  const [repertorioParaPartilhar, setRepertorioParaPartilhar] = useState<Repertorio | null>(null);
  const [emailDestinatario, setEmailDestinatario] = useState("");
  const [aPartilhar, setAPartilhar] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [aGerarPdf, setAGerarPdf] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [itemArrastado, setItemArrastado] = useState<number | null>(null);

  const projectId = "app-cifras-bcdce";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        
        const role = await getUserRole(currentUser);
        const userPerms = getPermissions(role);
        setPermissions(userPerms);

        await carregarRepertorios(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const carregarRepertorios = async (currentUser: User) => {
    try {
      setCarregando(true);
      const lista = await serviceGetRepertorios();
      const emailUser = currentUser.email?.toLowerCase() || "";
      const admin = isAdmin(currentUser);
      
      const repertoriosFormatados: Repertorio[] = [];

      lista.forEach((data: any) => {
        const musicasIds = data.musicasIds || [];
        const criadoPor = (data.criadoPor || data.email || "").toLowerCase();
        const compartilhadoCom = (data.compartilhadoCom || []).map((e: string) => e.toLowerCase());

        const eDono = criadoPor === emailUser || data.userId === currentUser.uid;
        const eCompartilhado = compartilhadoCom.includes(emailUser);

        if (admin || eDono || eCompartilhado) {
          repertoriosFormatados.push({
            id: data.id,
            titulo: data.titulo || "Sem título",
            descricao: data.descricao || "",
            totalMusicas: musicasIds.length,
            ordem: data.ordem ?? 0,
            userId: data.userId,
            criadoPor: data.criadoPor || "",
            compartilhadoCom: data.compartilhadoCom || [],
            musicasIds,
          });
        }
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

  const handleExcluir = async (id: string, titulo: string, donoId: string, criadoPor?: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const éAdmin = isAdmin(user);
    const éDono = user && (user.uid === donoId || user.email === criadoPor);

    if (!éAdmin && !éDono) {
      alert("Apenas o criador original pode eliminar este repertório.");
      return;
    }

    if (confirm(`Tem certeza de que deseja eliminar o repertório "${titulo}"?`)) {
      try {
        await serviceDeletarRepertorio(id, donoId);
        setRepertorios((prev) => prev.filter((r) => r.id !== id));
      } catch (erro: any) {
        alert(erro.message || "Erro ao eliminar repertório.");
      }
    }
  };

  const handlePartilhar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repertorioParaPartilhar || !emailDestinatario.trim()) return;

    try {
      setAPartilhar(true);
      const repRef = doc(db, "repertorios", repertorioParaPartilhar.id);
      
      await updateDoc(repRef, {
        compartilhadoCom: arrayUnion(emailDestinatario.trim().toLowerCase()),
      });

      setMensagemSucesso("Repertório partilhado com sucesso!");
      setEmailDestinatario("");
      setTimeout(() => {
        setMensagemSucesso("");
        setRepertorioParaPartilhar(null);
        if (user) carregarRepertorios(user);
      }, 1500);
    } catch (erro) {
      console.error("Erro ao partilhar repertório:", erro);
      alert("Erro ao partilhar repertório. Verifique o e-mail.");
    } finally {
      setAPartilhar(false);
    }
  };

  // Função para exportar e partilhar o PDF incluindo as letras
  const handlePartilharPDF = async () => {
    if (!repertorioParaPartilhar) return;

    try {
      setAGerarPdf(true);

      const resMusicas = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/musicas`,
        { cache: "no-store" }
      );

      const musicasDetalhes: any[] = [];
      if (resMusicas.ok) {
        const dadosMusicas = await resMusicas.json();
        if (dadosMusicas.documents) {
          const mapaMusicas = new Map<string, any>();
          dadosMusicas.documents.forEach((doc: any) => {
            const id = doc.name.split("/").pop();
            const f = doc.fields || {};
            mapaMusicas.set(id, {
              id,
              titulo: f.titulo?.stringValue || "Sem título",
              artista: f.artista?.stringValue || "Artista desconhecido",
              tomOriginal: f.tomOriginal?.stringValue || "C",
              letra: f.letra?.stringValue || f.cifra?.stringValue || "",
            });
          });

          const ids = repertorioParaPartilhar.musicasIds || [];
          ids.forEach((id) => {
            const m = mapaMusicas.get(id);
            if (m) musicasDetalhes.push(m);
          });
        }
      }

      const docPdf = new jsPDF();
      
      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(18);
      docPdf.text(repertorioParaPartilhar.titulo, 14, 20);

      if (repertorioParaPartilhar.descricao) {
        docPdf.setFont("helvetica", "normal");
        docPdf.setFontSize(11);
        docPdf.setTextColor(100);
        docPdf.text(repertorioParaPartilhar.descricao, 14, 28);
      }

      docPdf.setLineWidth(0.5);
      docPdf.setDrawColor(200, 200, 200);
      docPdf.line(14, 34, 196, 34);

      docPdf.setFont("helvetica", "bold");
      docPdf.setFontSize(12);
      docPdf.setTextColor(0, 0, 0);
      docPdf.text("Músicas:", 14, 44);

      let y = 52;
      musicasDetalhes.forEach((m, index) => {
        // Estima o tamanho necessário para esta música (título + metadados + linhas da letra)
        const linhasLetra = m.letra ? docPdf.splitTextToSize(m.letra, 180) : [];
        const alturaEstimada = 15 + (linhasLetra.length * 4) + 10;

        // Se o conteúdo ultrapassar o limite da página atual, cria uma nova página antes de desenhar
        if (y + alturaEstimada > 280) {
          docPdf.addPage();
          y = 20;
        }

        // Título da música
        docPdf.setFont("helvetica", "bold");
        docPdf.setFontSize(11);
        docPdf.setTextColor(0, 0, 0);
        docPdf.text(`${index + 1}. ${m.titulo}`, 14, y);

        // Artista e Tom
        docPdf.setFont("helvetica", "normal");
        docPdf.setFontSize(9);
        docPdf.setTextColor(100);
        docPdf.text(`Artista: ${m.artista} | Tom: ${m.tomOriginal}`, 14, y + 5);

        y += 12;

        // Letra / Cifra da música
        if (m.letra) {
          docPdf.setFont("courier", "normal");
          docPdf.setFontSize(8);
          docPdf.setTextColor(40, 40, 40);

          docPdf.text(linhasLetra, 14, y);
          y += (linhasLetra.length * 4) + 8;
        } else {
          y += 6;
        }
      });

      const pdfBlob = docPdf.output("blob");
      const pdfFile = new File([pdfBlob], `${repertorioParaPartilhar.titulo}.pdf`, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: repertorioParaPartilhar.titulo,
          text: `Segue o repertório: ${repertorioParaPartilhar.titulo}`,
          files: [pdfFile],
        });
      } else {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `${repertorioParaPartilhar.titulo}.pdf`;
        link.click();

        const mensagem = encodeURIComponent(`Olá! Segue em anexo o repertório "${repertorioParaPartilhar.titulo}".`);
        window.open(`https://api.whatsapp.com/send?text=${mensagem}`, "_blank");
      }

      setRepertorioParaPartilhar(null);
    } catch (erro) {
      console.error("Erro ao gerar PDF:", erro);
      alert("Não foi possível gerar o PDF.");
    } finally {
      setAGerarPdf(false);
    }
  };

  const repertoriosFiltrados = repertorios.filter(
    (r) =>
      r.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      r.descricao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-900 text-slate-100 p-4 w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-amber-400">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm">A carregar repertórios...</p>
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
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-3">
              <FolderKanban size={36} className="mx-auto opacity-40" />
              <p className="text-sm">Nenhum repertório encontrado.</p>
              {permissions?.canModifyContent && (
                <Link 
                  href="/repertorios/novo"
                  className="inline-block text-xs text-amber-400 font-semibold hover:underline"
                >
                  Criar o primeiro repertório
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {repertoriosFiltrados.map((r, index) => {
                const modoBuscaAtivo = termoBusca.trim().length > 0;
                const emailUser = user?.email?.toLowerCase().trim() || "";
                const criadoPorItem = (r.criadoPor || "").toLowerCase().trim();
                const eDono = (criadoPorItem && criadoPorItem === emailUser) || (r.userId && r.userId === user?.uid);
                const ePartilhado = !isAdmin(user) && !eDono;

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
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-bold text-slate-100 truncate text-base hover:text-amber-400 transition">
                          {r.titulo}
                        </h2>
                        {ePartilhado && (
                          <span className="px-2 py-0.5 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium shrink-0">
                            Partilhado
                          </span>
                        )}
                      </div>
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

                    {/* Botão de Partilha */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setRepertorioParaPartilhar(r)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700 rounded-lg transition"
                        title="Partilhar Repertório"
                      >
                        <Share2 size={16} />
                      </button>

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
                            onClick={(e) => handleExcluir(r.id, r.titulo, r.userId, r.criadoPor, e)}
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

      {/* Modal de Partilha */}
      {repertorioParaPartilhar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-amber-400 flex items-center gap-2">
                <Share2 size={18} /> Partilhar Repertório
              </h3>
              <button
                onClick={() => setRepertorioParaPartilhar(null)}
                className="text-slate-400 hover:text-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Partilhar <strong className="text-slate-100">{repertorioParaPartilhar.titulo}</strong>:
            </p>

            <div className="space-y-3 pt-1">
              {/* Botão de PDF / WhatsApp */}
              <button
                onClick={handlePartilharPDF}
                disabled={aGerarPdf || (repertorioParaPartilhar.totalMusicas === 0)}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow"
              >
                <FileText size={16} />
                <span>{aGerarPdf ? "A gerar PDF..." : "Partilhar PDF / WhatsApp"}</span>
              </button>
              {repertorioParaPartilhar.totalMusicas === 0 && (
                <p className="text-[10px] text-amber-400/80 italic text-center">
                  Adicione músicas para poder exportar o PDF.
                </p>
              )}

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
                      onClick={() => setRepertorioParaPartilhar(null)}
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