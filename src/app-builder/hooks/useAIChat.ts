import { useState, useCallback, useRef } from 'react';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string, code?: number) => void;
  onStatusChange: (status: string) => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (
      messages: ChatMessage[],
      callbacks: StreamCallbacks,
      projectContext?: string
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      callbacks.onStatusChange('Connexion au modèle IA…');

      try {
        const resp = await fetch(CHAT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages, projectContext }),
          signal: controller.signal,
        });

        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ error: 'Unknown error' }));
          const code = resp.status;

          if (code === 402) {
            callbacks.onError(
              errorData.message || "Crédits épuisés. Passez à Blink Pro pour continuer.",
              402
            );
          } else if (code === 429) {
            callbacks.onError(
              errorData.message || "Trop de requêtes. Réessayez dans quelques secondes.",
              429
            );
          } else if (code === 401) {
            callbacks.onError("Connectez-vous pour utiliser Blink AI.", 401);
          } else {
            callbacks.onError(errorData.error || "Erreur de génération IA.", code);
          }
          setIsStreaming(false);
          return;
        }

        if (!resp.body) {
          callbacks.onError("Pas de réponse du serveur.");
          setIsStreaming(false);
          return;
        }

        callbacks.onStatusChange('Génération du code…');

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                fullText += content;
                callbacks.onDelta(content);
              }
            } catch {
              // Incomplete JSON — put it back
              buffer = line + '\n' + buffer;
              break;
            }
          }
        }

        // Flush remaining
        if (buffer.trim()) {
          for (let raw of buffer.split('\n')) {
            if (!raw) continue;
            if (raw.endsWith('\r')) raw = raw.slice(0, -1);
            if (raw.startsWith(':') || raw.trim() === '') continue;
            if (!raw.startsWith('data: ')) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                fullText += content;
                callbacks.onDelta(content);
              }
            } catch {
              /* ignore partial */
            }
          }
        }

        callbacks.onStatusChange('Finalisation…');
        callbacks.onDone(fullText);
      } catch (e: any) {
        if (e.name === 'AbortError') {
          callbacks.onDone('');
        } else {
          console.error('Stream error:', e);
          callbacks.onError(e.message || 'Erreur de connexion.');
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    []
  );

  return { sendMessage, stopStreaming, isStreaming };
}

/**
 * Extract TSX code from AI response text.
 * Looks for ```tsx ... ``` code blocks.
 */
export function extractCodeFromResponse(text: string): string | null {
  // Try tsx/jsx/react code blocks
  const patterns = [
    /```tsx\s*\n([\s\S]*?)```/,
    /```jsx\s*\n([\s\S]*?)```/,
    /```react\s*\n([\s\S]*?)```/,
    /```javascript\s*\n([\s\S]*?)```/,
    /```\s*\n([\s\S]*?)```/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return null;
}
