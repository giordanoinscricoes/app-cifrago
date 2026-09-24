"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErroMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setErroMsg("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      setErroMsg("Não foi possível autenticar com o Google. Tente novamente.");
    } finally {
      setGoogleLoading(false);
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
          <h1 className="text-xl font-bold tracking-tight text-slate-100 mt-1">
            
          </h1>
        </div>

        {/* Mensagem de Erro, caso exista */}
        {erroMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl text-center">
            {erroMsg}
          </div>
        )}

        {/* Botão Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium py-3 rounded-xl transition flex items-center justify-center gap-3 text-sm shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin text-amber-400" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.1 8.8 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.7c-.2-.7-.3-1.5-.3-2.3s.1-1.6.3-2.3L1.6 7.2C.6 9.2 0 11.5 0 13.9s.6 4.7 1.6 6.7l3.7-2.9c-.2-.7-.3-1.5-.3-2.3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.1-6.7-5.1L1.6 16c1.9 3.8 5.8 7 10.4 7z"
              />
            </svg>
          )}
          <span>Continuar com o Google</span>
        </button>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="px-3 text-xs text-slate-500 uppercase tracking-widest">ou e-mail</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

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
            disabled={loading || googleLoading}
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

        {/* Rodapé / Ir para o Cadastro */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Ainda não tens uma conta?{" "}
            <Link href="/login-cadastro" className="text-amber-400 font-semibold hover:underline">
              Criar conta
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}