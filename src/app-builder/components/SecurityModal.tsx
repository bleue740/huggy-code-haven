import React from "react";
import { X, ShieldCheck, CheckCircle2, AlertTriangle, Info, Loader2 } from "lucide-react";
import type { SecurityResult } from "../types";

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  score: number;
  results: SecurityResult[];
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, isRunning, score, results }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Security Run</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Infrastructure Scan</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          {isRunning ? (
            <div className="py-20 flex flex-col items-center text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <h4 className="text-white font-bold text-lg">Scanning…</h4>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between p-6 bg-[#1a1a1a] rounded-2xl border border-[#333]">
                <div>
                  <div className="text-3xl font-black text-white">{score}%</div>
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1">Security Score</div>
                </div>
                <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-blue-500/20 text-blue-400">High</div>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {results?.map((res, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                    <div className="mt-0.5 text-blue-500">
                      {res.status === "passed" ? <CheckCircle2 size={16} /> : res.status === "warning" ? <AlertTriangle size={16} /> : <Info size={16} />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{res.name}</div>
                      <div className="text-[11px] text-neutral-500 mt-1">{res.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={onClose} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:opacity-90">
                Close Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
