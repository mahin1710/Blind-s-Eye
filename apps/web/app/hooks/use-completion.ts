import { useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { readStream } from '~/utils/stream';

type UseCompletionOptions = {
  endpoint: string;
  onError?: (error: Error) => void;
  onFinish?: () => void;
};

export function useCompletion(options: UseCompletionOptions) {
  const { endpoint, onError, onFinish } = options;

  const abortControllerRef = useRef<AbortController | null>(null);
  const [completion, setCompletion] = useState<string | null>(null);

  const [status, setStatus] = useState<
    'idle' | 'streaming' | 'loading' | 'ready' | 'error'
  >('idle');

  const sendCompletion = useCallback(
    async (prompt: string, requestOptions: RequestInit = {}) => {
      try {
        setStatus('loading');
        setCompletion(null);
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(requestOptions.headers as Record<string, string>),
        };

        const body = requestOptions.body
          ? requestOptions.body
          : JSON.stringify({ prompt });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body,
          ...requestOptions,
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          let errorMessage = 'Something went wrong';
          try {
            const data = await response.json();
            errorMessage = data?.message || `HTTP ${response.status}: ${response.statusText}`;
          } catch {
            errorMessage = `Server returned status ${response.status}`;
          }
          setStatus('error');
          const error = new Error(errorMessage);
          onError?.(error);
          return null;
        }

        const stream = response.body;
        if (!stream) {
          setStatus('error');
          const error = new Error('No readable response stream received from server');
          onError?.(error);
          return null;
        }

        let result: string | null = null;
        await readStream(stream, {
          onMessage: async (content) => {
            flushSync(() => {
              setStatus('streaming');
              result = content;
              setCompletion(result);
            });
          },
          onMessageEnd: async (content) => {
            result = content;
            flushSync(() => {
              setCompletion(result);
              setStatus('ready');
            });
          },
        });

        setStatus('idle');
        abortControllerRef.current = null;
        onFinish?.();

        return result;
      } catch (error) {
        if (abortControllerRef.current?.signal.aborted) {
          return null;
        }

        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
        setStatus('error');
        return null;
      }
    },
    [endpoint, onError, onFinish]
  );

  const stop = useCallback(() => {
    if (!abortControllerRef.current) {
      return;
    }

    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setCompletion(null);
    abortControllerRef.current = null;
  }, []);

  return {
    completion,
    sendCompletion,
    status,
    stop,
    reset,
  };
}
