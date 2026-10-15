"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, FileText, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function RegistoPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  const handleRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErroMsg("");

    if (password !== confirmPassword) {
      setErroMsg("As senhas não coincidem. Verifique e tente novamente.");
      setLoading(false);
      return;
    }

    try {
      // 1. Cria o utilizador no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Cria o documento correspondente no Firestore com os dados e aprovado: false
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        nome: nome,
        cpf: cpf,
        telefone: telefone,
        email: email,
        aprovado: false,
        role: "private",
        criado_em: new Date().toISOString(),
      });

      alert("Conta criada com sucesso! Aguarde a aprovação do administrador para aceder à aplicação.");
      router.push("/login");
    } catch (error: any) {
      console.error("Erro no registo:", error);
      if (error.code === "auth/email-already-in-use") {
        setErroMsg("Este e-mail já está associado a uma conta.");
      } else if (error.code === "auth/weak-password") {
        setErroMsg("A senha deve ter pelo menos 6 caracteres.");
      } else if (error.code === "auth/invalid-email") {
        setErroMsg("O formato do e-mail é inválido.");
      } else {
        setErroMsg("Ocorreu um erro ao criar a conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-amber-500/20 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
        
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
            Crie sua Conta
          </h1>
        </div>

        {erroMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl text-center">
            {erroMsg}
          </div>
        )}

        <form onSubmit={handleRegisto} className="space-y-4">
          
          {/* Nome Completo */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Nome Completo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* CPF */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              CPF
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <FileText size={16} />
              </span>
              <input
                type="text"
                required
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Telefone de Contato
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Phone size={16} />
              </span>
              <input
                type="text"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* E-mail */}
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

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Senha (mínimo 6 carateres)
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

          {/* Confirmar Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Confirmar Senha
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-500/10 active:scale-[0.99] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>A criar conta...</span>
              </>
            ) : (
              <>
                <span>Registar</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Já tens uma conta?{" "}
            <Link href="/login" className="text-amber-400 font-semibold hover:underline">
              Fazer login
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}