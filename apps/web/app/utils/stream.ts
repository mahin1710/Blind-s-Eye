export const CHAT_RESPONSE_PREFIX = {
  message: '0',
  details: 'd',
} as const;

const NEWLINE = '\n'.charCodeAt(0);

function concatChunks(chunks: Uint8Array[], totalLength: number) {
  const concatenatedChunks = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    concatenatedChunks.set(chunk, offset);
    offset += chunk.length;
  }
  chunks.length = 0;

  return concatenatedChunks;
}

export async function readStream(
  stream: ReadableStream<Uint8Array>,
  {
    onMessage,
    onMessageEnd,
    onDetails,
  }: {
    onMessage?: (message: string) => Promise<void> | void;
    onMessageEnd?: (message: string) => Promise<void> | void;
    onDetails?: (details: any) => Promise<void> | void;
  }
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  const chunks: Uint8Array[] = [];

  let totalLength = 0;
  let result = '';

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (value) {
        chunks.push(value);
        totalLength += value.length;
        if (!done && value[value.length - 1] !== NEWLINE) {
          // Wait for next chunk to complete line if not done
          continue;
        }
      }

      if (chunks.length === 0 && done) {
        // Stream completed
        break;
      }

      if (chunks.length > 0) {
        const concatenatedChunks = concatChunks(chunks, totalLength);
        totalLength = 0;

        const text = decoder.decode(concatenatedChunks, { stream: !done });
        const lines = text.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          const separatorIndex = line.indexOf(':');
          if (separatorIndex === -1) {
            // Line without prefix, treat as direct message chunk if non-empty
            result += line;
            await onMessage?.(result);
            continue;
          }

          const prefix = line.slice(0, separatorIndex);
          const rawContent = line.slice(separatorIndex + 1);

          let parsedContent: any = rawContent;
          try {
            parsedContent = JSON.parse(rawContent);
          } catch {
            // Keep raw string if not JSON
          }

          switch (prefix) {
            case CHAT_RESPONSE_PREFIX.message:
              result +=
                typeof parsedContent === 'string'
                  ? parsedContent
                  : String(parsedContent);
              await onMessage?.(result);
              break;
            case CHAT_RESPONSE_PREFIX.details:
              await onDetails?.(parsedContent);
              break;
            default:
              // Fallback for custom or direct text
              result += rawContent;
              await onMessage?.(result);
              break;
          }
        }
      }

      if (done) {
        break;
      }
    }

    await onMessageEnd?.(result);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }
}
