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
    async (prompt: string, options: RequestInit = {}) => {
      try {
        setStatus('loading');
        setCompletion(null);
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify({ prompt }),
          ...options,
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          setStatus('error');
          throw new Error(data?.message || 'Something went wrong');
        }

        const stream = response.body;
        if (!stream) {
          setStatus('error');
          throw new Error('Something went wrong');
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
          // we don't want to show error if the user stops the chat
          // so we just return
          return;
        }

        onError?.(error as Error);
        setStatus('error');
        return null;
      }
    },
    [endpoint, onError]
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
