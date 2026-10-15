"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AboutModal from "@/components/AboutModal";
import { isAdmin } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErroMsg("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Se for o admin principal, libera acesso direto
      if (isAdmin(user)) {
        router.push("/");
        return;
      }

      // Verifica no Firestore se o utilizador está aprovado
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.aprovado !== true) {
          await signOut(auth);
          setErroMsg("A sua conta aguarda aprovação do administrador.");
          setLoading(false);
          return;
        }
      } else {
        // Se não existir registo no Firestore, bloqueia por segurança
        await signOut(auth);
        setErroMsg("Registo não encontrado ou pendente de aprovação.");
        setLoading(false);
        return;
      }

      router.push("/");
    } catch (error: any) {
      console.error("Erro no login:", error);
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        setErroMsg("E-mail ou senha incorretos.");
      } else if (error.code === "auth/invalid-email") {
        setErroMsg("O formato do e-mail é inválido.");
      } else {
        setErroMsg("Ocorreu um erro ao entrar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-amber-500/20 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
        
        {/* Cabeçalho com o Logótipo do CifraGo */}
        <div className="flex flex-col items-center py-2 border-b border-slate-800/80 pb-6">
          <div className="relative w-28 h-24 drop-shadow-[0_10px_20px_rgba(245,158,11,0.15)] mb-2">
            <Image
              src="/logo.png"
              alt="Logo CifraGo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-xs text-amber-400/90 font-medium tracking-wide italic mt-1">
            Seus acordes, o seu ritmo
          </p>
        </div>

        {/* Mensagem de Erro, caso exista */}
        {erroMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl text-center">
            {erroMsg}
          </div>
        )}

        {/* Formulário Tradicional */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Campo E-mail */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botão Submeter */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/10 active:scale-[0.99] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>A entrar...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Rodapé / Ir para o Cadastro e Sobre */}
        <div className="text-center pt-2 space-y-3">
          <p className="text-xs text-slate-400">
            Ainda não tens uma conta?{" "}
            <Link href="/login-cadastro" className="text-amber-400 font-semibold hover:underline">
              Criar conta
            </Link>
          </p>

          <div className="pt-2 border-t border-slate-800/50 flex justify-center">
            <button 
              type="button"
              onClick={() => setIsAboutOpen(true)}
              className="text-[11px] uppercase tracking-widest text-slate-400 hover:text-amber-400 font-medium transition"
            >
              Sobre o CifraGo
            </button>
          </div>
        </div>

      </div>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </main>
  );
}