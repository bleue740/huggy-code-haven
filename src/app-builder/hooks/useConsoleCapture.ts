import { useState, useCallback, useRef, useEffect } from 'react';
import { ConsoleLog } from '../components/ConsolePanel';

export function useConsoleCapture() {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const addLog = useCallback((type: ConsoleLog['type'], message: string, stack?: string) => {
    const log: ConsoleLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      stack,
    };
    setLogs((prev) => [...prev, log].slice(-500));
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        const { level, args, stack } = event.data;
        const message = args
          .map((arg: any) => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg, null, 2);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(' ');

        addLog(level as ConsoleLog['type'], message, stack);
      }

      if (event.data?.type === 'error') {
        addLog('error', event.data.message, event.data.stack);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addLog]);

  return {
    logs,
    addLog,
    clearLogs,
    iframeRef,
  };
}

export const CONSOLE_CAPTURE_SCRIPT = `
<script>
(function() {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  function serializeArg(arg) {
    if (arg instanceof Error) {
      return { message: arg.message, stack: arg.stack };
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.parse(JSON.stringify(arg));
      } catch {
        return String(arg);
      }
    }
    return arg;
  }

  function captureAndSend(level, args) {
    const serializedArgs = Array.from(args).map(serializeArg);
    const stack = level === 'error' ? new Error().stack : undefined;

    try {
      window.parent.postMessage({
        type: 'console',
        level: level,
        args: serializedArgs,
        stack: stack,
      }, '*');
    } catch (e) {
      // Ignore postMessage errors
    }
  }

  console.log = function(...args) {
    captureAndSend('log', args);
    return originalConsole.log.apply(console, args);
  };

  console.warn = function(...args) {
    captureAndSend('warn', args);
    return originalConsole.warn.apply(console, args);
  };

  console.error = function(...args) {
    captureAndSend('error', args);
    return originalConsole.error.apply(console, args);
  };

  console.info = function(...args) {
    captureAndSend('info', args);
    return originalConsole.info.apply(console, args);
  };

  window.addEventListener('error', function(event) {
    window.parent.postMessage({
      type: 'error',
      message: event.message || 'Unknown error',
      stack: event.error?.stack || (event.filename + ':' + event.lineno),
    }, '*');
  });

  window.addEventListener('unhandledrejection', function(event) {
    window.parent.postMessage({
      type: 'error',
      message: 'Unhandled Promise Rejection: ' + (event.reason?.message || String(event.reason)),
      stack: event.reason?.stack,
    }, '*');
  });
})();
</script>
`;
