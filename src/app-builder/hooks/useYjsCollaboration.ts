import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next';
import { Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { supabase } from '@/integrations/supabase/client';

export interface CollabUser {
  name: string;
  color: string;
  clientId: number;
}

const COLLAB_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#8b5cf6',
];

function pickColor(id: number): string {
  return COLLAB_COLORS[id % COLLAB_COLORS.length];
}

export function useYjsCollaboration(projectId: string | undefined, activeFile: string) {
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<CollabUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [collabExtension, setCollabExtension] = useState<Extension[]>([]);

  // Get or create the Y.Text for a specific file
  const getYText = useCallback((fileName: string): Y.Text | null => {
    if (!ydocRef.current) return null;
    return ydocRef.current.getText(`file:${fileName}`);
  }, []);

  // Initialize Yjs document and WebRTC provider
  useEffect(() => {
    if (!projectId) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const roomName = `blink-collab-${projectId}`;
    const provider = new WebrtcProvider(roomName, ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'],
    });
    providerRef.current = provider;

    // Set user awareness info
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userName = data.user?.email?.split('@')[0] || `User-${Math.floor(Math.random() * 1000)}`;
      const userColor = pickColor(ydoc.clientID);
      provider.awareness.setLocalStateField('user', {
        name: userName,
        color: userColor,
        colorLight: `${userColor}33`,
      });
    })();

    // Track connection status
    provider.on('synced', ({ synced }: { synced: boolean }) => {
      setIsConnected(synced);
    });

    // Track connected users via awareness
    const updateUsers = () => {
      const states = provider.awareness.getStates();
      const users: CollabUser[] = [];
      states.forEach((state, clientId) => {
        if (state.user && clientId !== ydoc.clientID) {
          users.push({
            name: state.user.name,
            color: state.user.color,
            clientId,
          });
        }
      });
      setConnectedUsers(users);
    };

    provider.awareness.on('change', updateUsers);
    setIsConnected(true);

    return () => {
      provider.awareness.off('change', updateUsers);
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setIsConnected(false);
      setConnectedUsers([]);
    };
  }, [projectId]);

  // Build CodeMirror extension when activeFile changes
  useEffect(() => {
    if (!ydocRef.current || !providerRef.current || !projectId) {
      setCollabExtension([]);
      return;
    }

    const ytext = ydocRef.current.getText(`file:${activeFile}`);
    const undoManager = new Y.UndoManager(ytext);
    const awareness = providerRef.current.awareness;

    const ext: Extension[] = [
      yCollab(ytext, awareness, { undoManager }),
      keymap.of(yUndoManagerKeymap),
    ];

    setCollabExtension(ext);

    return () => {
      undoManager.destroy();
    };
  }, [activeFile, projectId]);

  // Sync initial content into Y.Text if empty
  const syncInitialContent = useCallback((fileName: string, content: string) => {
    if (!ydocRef.current) return;
    const ytext = ydocRef.current.getText(`file:${fileName}`);
    if (ytext.length === 0 && content.length > 0) {
      ydocRef.current.transact(() => {
        ytext.insert(0, content);
      });
    }
  }, []);

  // Get current content from Y.Text
  const getContent = useCallback((fileName: string): string | null => {
    if (!ydocRef.current) return null;
    const ytext = ydocRef.current.getText(`file:${fileName}`);
    return ytext.toString();
  }, []);

  // Observe changes on a file's Y.Text
  const observeFile = useCallback((fileName: string, callback: (content: string) => void) => {
    if (!ydocRef.current) return () => {};
    const ytext = ydocRef.current.getText(`file:${fileName}`);
    const handler = () => callback(ytext.toString());
    ytext.observe(handler);
    return () => ytext.unobserve(handler);
  }, []);

  return {
    isConnected,
    connectedUsers,
    collabExtension,
    syncInitialContent,
    getContent,
    getYText,
    observeFile,
    ydoc: ydocRef.current,
  };
}
