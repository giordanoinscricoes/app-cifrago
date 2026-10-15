"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, User, Phone, FileText, Mail, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { isAdmin } from "@/lib/auth";

interface UserProfile {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  aprovado: boolean;
  role: 'admin' | 'viewer' | 'private';
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [utilizadores, setUtilizadores] = useState<UserProfile[]>([]);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || !isAdmin(currentUser)) {
        router.push("/");
        return;
      }
      await carregarUtilizadores();
    });

    return () => unsubscribe();
  }, [router]);

  const carregarUtilizadores = async () => {
    try {
      setCarregando(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const lista: UserProfile[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        lista.push({
          id: docSnap.id,
          nome: data.nome || data.email || "Sem nome",
          cpf: data.cpf || "Não informado",
          telefone: data.telefone || "Não informado",
          email: data.email || "Sem e-mail",
          aprovado: data.aprovado ?? false,
          role: data.role || "private",
        });
      });

      setUtilizadores(lista);
    } catch (erro) {
      console.error("Erro ao carregar utilizadores do Firestore:", erro);
    } finally {
      setCarregando(false);
    }
  };

  const alterarAprovacao = async (id: string, estadoAtual: boolean) => {
    try {
      const { doc: firestoreDoc, updateDoc } = await import("firebase/firestore");
      const userRef = firestoreDoc(db, "users", id);
      await updateDoc(userRef, { aprovado: !estadoAtual });

      setUtilizadores((prev) =>
        prev.map((u) => (u.id === id ? { ...u, aprovado: !estadoAtual } : u))
      );
    } catch (erro) {
      console.error("Erro ao atualizar aprovação:", erro);
      alert("Erro ao alterar o estado de aprovação.");
    }
  };

  const alterarRole = async (id: string, novoRole: 'admin' | 'viewer' | 'private') => {
    try {
      const { doc: firestoreDoc, updateDoc } = await import("firebase/firestore");
      const userRef = firestoreDoc(db, "users", id);
      await updateDoc(userRef, { role: novoRole });

      setUtilizadores((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: novoRole } : u))
      );
    } catch (erro) {
      console.error("Erro ao atualizar papel do utilizador:", erro);
      alert("Erro ao alterar o nível de acesso.");
    }
  };

  const toggleExpandir = (id: string) => {
    setExpandidoId(expandidoId === id ? null : id);
  };

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400">
        <Loader2 size={32} className="animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-2xl mx-auto flex flex-col justify-between">
      <div>
        <header className="flex items-center justify-between py-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 text-slate-300 transition border border-slate-800"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-amber-400" size={24} />
              <h1 className="text-xl font-bold text-amber-400">Gestão de Utilizadores</h1>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total: {utilizadores.length}
          </span>
        </header>

        <div className="space-y-3">
          {utilizadores.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-sm">Nenhum documento encontrado na coleção "users".</p>
            </div>
          ) : (
            utilizadores.map((u) => {
              const estaExpandido = expandidoId === u.id;

              return (
                <div
                  key={u.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 transition shadow-md space-y-3"
                >
                  {/* Linha Superior: Nome do Utilizador e botão de expandir */}
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleExpandir(u.id)}
                      className="flex-1 flex items-center gap-2 text-left font-semibold text-slate-100 hover:text-amber-400 transition truncate"
                    >
                      <User size={16} className="text-amber-400 shrink-0" />
                      <span className="truncate text-base">{u.nome}</span>
                      {estaExpandido ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                    </button>
                  </div>

                  {/* Linha Inferior: Botões de Nível e Aprovação alinhados abaixo do nome */}
                  <div className="flex items-center gap-3 pt-1 border-t border-slate-800/60">
                    <select
                      value={u.role}
                      onChange={(e) => alterarRole(u.id, e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-medium focus:outline-none focus:border-amber-400"
                    >
                      <option value="private">Private</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>

                    <button
                      onClick={() => alterarAprovacao(u.id, u.aprovado)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        u.aprovado
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                      }`}
                    >
                      {u.aprovado ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Aprovado</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          <span>Pendente</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Caixa Expansível com Detalhes */}
                  {estaExpandido && (
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs text-slate-300 animate-fade-in mt-2">
                      <div className="flex items-center gap-2.5">
                        <Mail size={14} className="text-amber-400 shrink-0" />
                        <span className="font-mono text-slate-200">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <FileText size={14} className="text-amber-400 shrink-0" />
                        <span>CPF: <strong className="font-mono text-slate-200">{u.cpf}</strong></span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Phone size={14} className="text-amber-400 shrink-0" />
                        <span>Telefone: <strong className="font-mono text-slate-200">{u.telefone}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}