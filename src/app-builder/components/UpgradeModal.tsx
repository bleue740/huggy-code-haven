import React from "react";
import { X, Zap, CheckCircle2, Rocket } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="relative p-12">
          <button onClick={onClose} className="absolute top-8 right-8 text-neutral-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-8">
              <Zap size={40} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Upgrade to Blink Pro</h2>
            <p className="text-neutral-400 font-medium text-lg max-w-md mb-12">
              Libérez toute la puissance de l'IA avec des builds illimités.
            </p>
            <div className="grid grid-cols-2 gap-6 w-full mb-12">
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-[#333] text-left">
                <div className="flex items-center gap-2 text-blue-500 mb-2 font-black text-xs uppercase tracking-widest">
                  <CheckCircle2 size={14} /> Performance
                </div>
                <p className="text-white font-bold">Modèles Ultra-rapides</p>
                <p className="text-neutral-500 text-sm mt-1">Accès prioritaire aux GPU H100.</p>
              </div>
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-[#333] text-left">
                <div className="flex items-center gap-2 text-blue-500 mb-2 font-black text-xs uppercase tracking-widest">
                  <CheckCircle2 size={14} /> Privacy
                </div>
                <p className="text-white font-bold">Mode Privé</p>
                <p className="text-neutral-500 text-sm mt-1">Vos données ne sont pas entraînées.</p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); onUpgrade(); }}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Passer Pro - $29/mois <Rocket size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
