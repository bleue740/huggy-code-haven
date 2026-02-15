import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import type { CollabUser } from '../hooks/useYjsCollaboration';

interface CollabIndicatorProps {
  isConnected: boolean;
  connectedUsers: CollabUser[];
}

export const CollabIndicator: React.FC<CollabIndicatorProps> = ({ isConnected, connectedUsers }) => {
  if (!isConnected && connectedUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#1a1a1a] rounded-xl">
      {isConnected ? (
        <Wifi size={12} className="text-emerald-400" />
      ) : (
        <WifiOff size={12} className="text-red-400" />
      )}

      {connectedUsers.length > 0 && (
        <div className="flex items-center -space-x-1.5">
          {connectedUsers.slice(0, 5).map((user) => (
            <div
              key={user.clientId}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white border border-[#0a0a0a] uppercase"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0)}
            </div>
          ))}
          {connectedUsers.length > 5 && (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-neutral-400 bg-[#1a1a1a] border border-[#0a0a0a]">
              +{connectedUsers.length - 5}
            </div>
          )}
        </div>
      )}

      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
        {connectedUsers.length > 0
          ? `${connectedUsers.length + 1} en ligne`
          : 'Collab active'
        }
      </span>
    </div>
  );
};
