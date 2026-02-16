import React from "react";
import { X, History } from "lucide-react";
import type { Message } from "../types";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, messages }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[#111] border border-[#1a1a1a] w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">Conversation History</h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">All your messages</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 p-4 bg-[#1a1a1a] rounded-xl border border-[#333]">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${msg.role === "assistant" ? "bg-blue-500/10 text-blue-400" : "bg-neutral-700/20 text-neutral-400"}`}>
                  {msg.role === "assistant" ? "🤖" : "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-neutral-500 uppercase">
                    {msg.role === "assistant" ? "BLINK" : "YOU"}
                  </span>
                  <p className="text-sm text-white line-clamp-3">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button onClick={onClose} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
