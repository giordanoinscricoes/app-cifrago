"use client";

import Image from "next/image";
import { X } from "lucide-react";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
      {/* Janela Estilo Software (Firefox / Desktop App Style) */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        
        {/* Barra de Título da Janela (Estilo Sistema Operativo) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">
            Sobre o CifraGo
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo Principal (Layout de Duas Colunas Inspirado no Firefox) */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
          
          {/* Coluna Esquerda: Logótipo Grande com Efeito Dourado */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 drop-shadow-[0_10px_25px_rgba(245,158,11,0.2)]">
              <Image
                src="/logo.png"
                alt="Logo CifraGo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Coluna Direita: Informações, Versão e Créditos */}
          <div className="flex-grow text-center sm:text-left space-y-4">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-100">
                CifraGo
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-amber-400/90 font-medium">
                <span>Versão 1.0.0</span>
                <span className="text-slate-600">•</span>
                <button 
                  onClick={() => alert("O CifraGo já está atualizado na versão mais recente!")} 
                  className="hover:underline text-slate-300 hover:text-amber-300 transition"
                >
                  Verificar atualizações
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O CifraGo é desenvolvido por <span className="text-amber-400 font-semibold">Gerson e Giordano</span>, unindo paixão pela música e tecnologia para manter os seus acordes e cifras organizados com elegância e alta performance.
            </p>

            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <p>Precisa de suporte ou quer colaborar?</p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
                <a href="#ajuda" onClick={(e) => {e.preventDefault(); alert("Central de Ajuda CifraGo em breve.");}} className="text-amber-400 hover:underline">Ajuda</a>
                <span>•</span>
                <a href="#feedback" onClick={(e) => {e.preventDefault(); alert("Obrigado pelo interesse! Envie seu feedback para suporte@cifrago.com");}} className="text-amber-400 hover:underline">Enviar opinião</a>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé da Janela: Links Legais e Copyright (Exatamente igual ao do Firefox) */}
        <div className="bg-slate-950/60 border-t border-slate-800/80 px-6 py-4 flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-6 text-[11px] text-slate-400 font-medium">
            <a href="#licenca" onClick={(e) => {e.preventDefault(); alert("Termos de licença de uso do software CifraGo.");}} className="hover:text-amber-400 hover:underline transition">
              Informações de licenciamento
            </a>
            <a href="#termos" onClick={(e) => {e.preventDefault(); alert("Termos de uso aplicáveis.");}} className="hover:text-amber-400 hover:underline transition">
              Termos de uso
            </a>
            <a href="#privacidade" onClick={(e) => {e.preventDefault(); alert("Política de privacidade e proteção de dados.");}} className="hover:text-amber-400 hover:underline transition">
              Aviso de privacidade
            </a>
          </div>

          <p className="text-[10px] text-slate-400 text-center">
            CifraGo e seus logótipos são marcas registadas por <span className="text-slate-300">Gerson e Giordano</span>.
          </p>
        </div>

      </div>
    </div>
  );
}