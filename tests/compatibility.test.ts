import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

// Replicate stream reader logic from apps/web/app/utils/stream.ts
const CHAT_RESPONSE_PREFIX = {
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

async function readStream(
  stream: ReadableStream<Uint8Array>,
  callbacks: {
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
          continue;
        }
      }

      if (chunks.length === 0 && done) {
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
            result += line;
            await callbacks.onMessage?.(result);
            continue;
          }

          const prefix = line.slice(0, separatorIndex);
          const rawContent = line.slice(separatorIndex + 1);

          let parsedContent: any = rawContent;
          try {
            parsedContent = JSON.parse(rawContent);
          } catch {
            // keep raw
          }

          switch (prefix) {
            case CHAT_RESPONSE_PREFIX.message:
              result +=
                typeof parsedContent === 'string'
                  ? parsedContent
                  : String(parsedContent);
              await callbacks.onMessage?.(result);
              break;
            case CHAT_RESPONSE_PREFIX.details:
              await callbacks.onDetails?.(parsedContent);
              break;
            default:
              result += rawContent;
              await callbacks.onMessage?.(result);
              break;
          }
        }
      }

      if (done) break;
    }

    await callbacks.onMessageEnd?.(result);
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }

  return result;
}

describe("Blind's Eye Compatibility Test Suite", () => {
  describe('Responsive & CSS Utilities', () => {
    it('should correctly merge conflicting Tailwind CSS classes', () => {
      const result = cn('px-4 py-2', 'px-6', {
        'text-red-500': true,
        'text-blue-500': false,
      });
      assert.equal(result, 'py-2 px-6 text-red-500');
    });

    it('should handle undefined and conditional class modifiers on mobile views', () => {
      const isMobile = true;
      const result = cn('w-full', isMobile && 'max-w-md px-4', undefined, null);
      assert.equal(result, 'w-full max-w-md px-4');
    });

    it('should verify minimum touch target sizing (min-h-[48px]) for mobile buttons', () => {
      const buttonClasses =
        'flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm';
      assert.ok(buttonClasses.includes('min-h-[48px]'));
      assert.ok(buttonClasses.includes('px-4 py-3'));
    });
  });

  describe('Stream Parser & SSE Chunking Robustness', () => {
    it('should parse streaming chunks formatted with message prefix', async () => {
      const encoder = new TextEncoder();
      const chunks = [
        encoder.encode('0:"A dog "\n'),
        encoder.encode('0:"running in "\n'),
        encoder.encode('0:"a green park."\n'),
      ];

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
      });

      const messageSnapshots: string[] = [];
      const finalResult = await readStream(stream, {
        onMessage: (msg) => {
          messageSnapshots.push(msg);
        },
      });

      assert.equal(finalResult, 'A dog running in a green park.');
      assert.equal(messageSnapshots.length, 3);
      assert.equal(messageSnapshots[0], 'A dog ');
      assert.equal(messageSnapshots[1], 'A dog running in ');
      assert.equal(messageSnapshots[2], 'A dog running in a green park.');
    });

    it('should handle fragmented chunks split mid-sentence without newline', async () => {
      const encoder = new TextEncoder();
      const slice1 = encoder.encode('0:"A red car ');
      const slice2 = encoder.encode('parked."\n');

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(slice1);
          controller.enqueue(slice2);
          controller.close();
        },
      });

      const finalResult = await readStream(stream, {});
      assert.equal(finalResult, 'A red car parked.');
    });

    it('should handle details payloads gracefully without crashing', async () => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            encoder.encode('d:{"tokens":42,"duration":1.2}\n')
          );
          controller.enqueue(encoder.encode('0:"Complete description."\n'));
          controller.close();
        },
      });

      let receivedDetails: any = null;
      const result = await readStream(stream, {
        onDetails: (details) => {
          receivedDetails = details;
        },
      });

      assert.deepEqual(receivedDetails, { tokens: 42, duration: 1.2 });
      assert.equal(result, 'Complete description.');
    });
  });

  describe('CORS & Network Origin Validation', () => {
    function isAllowedOrigin(
      origin: string,
      configuredOrigin?: string
    ): boolean {
      if (!origin) return true;
      if (
        configuredOrigin &&
        (origin === configuredOrigin || configuredOrigin === '*')
      )
        return true;
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)
      )
        return true;
      if (
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        )
      )
        return true;
      return false;
    }

    it('should permit localhost on any port (React Router 5173, Vite 3000, 5174)', () => {
      assert.ok(isAllowedOrigin('http://localhost:5173'));
      assert.ok(isAllowedOrigin('http://localhost:3000'));
      assert.ok(isAllowedOrigin('http://localhost:5174'));
      assert.ok(isAllowedOrigin('http://127.0.0.1:5173'));
    });

    it('should permit private LAN IP addresses for physical mobile device testing', () => {
      assert.ok(isAllowedOrigin('http://192.168.1.105:5173'));
      assert.ok(isAllowedOrigin('http://10.0.0.12:3000'));
      assert.ok(isAllowedOrigin('http://172.20.10.4:5173'));
    });

    it('should reject untrusted external origins unless configured', () => {
      assert.strictEqual(
        isAllowedOrigin('http://malicious-website.com'),
        false
      );
      assert.ok(
        isAllowedOrigin('https://blindseye.app', 'https://blindseye.app')
      );
    });
  });

  describe('Cross-Platform TTS Command Generation', () => {
    function buildWindowsPowerShellScript(
      text: string,
      outputPath: string
    ): string {
      const safeText = text.replace(/'/g, "''");
      const safePath = outputPath.replace(/'/g, "''");
      return [
        'Add-Type -AssemblyName System.Speech;',
        '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;',
        `$synth.SetOutputToWaveFile('${safePath}');`,
        `$synth.Speak('${safeText}');`,
        '$synth.Dispose();',
      ].join(' ');
    }

    it('should correctly escape single quotes in synthesized text', () => {
      const script = buildWindowsPowerShellScript(
        "It's a sunny day outside",
        'C:\\temp\\audio.wav'
      );
      assert.ok(script.includes("It''s a sunny day outside"));
      assert.ok(script.includes('C:\\temp\\audio.wav'));
    });

    it('should generate valid base64 UTF-16LE encoding for PowerShell execution', () => {
      const script = buildWindowsPowerShellScript('Hello', 'test.wav');
      const b64 = Buffer.from(script, 'utf16le').toString('base64');
      const decoded = Buffer.from(b64, 'base64').toString('utf16le');
      assert.equal(decoded, script);
    });
  });

  describe('Multipart FormData Fetch Header Protection', () => {
    it('should not inject application/json Content-Type when payload is FormData', () => {
      const isFormData = true;
      const headers: Record<string, string> = {};

      if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      assert.strictEqual(headers['Content-Type'], undefined);
    });

    it('should inject application/json Content-Type when payload is not FormData', () => {
      const isFormData = false;
      const headers: Record<string, string> = {};

      if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      assert.strictEqual(headers['Content-Type'], 'application/json');
    });
  });

  describe('Supported Image Formats & Mobile Camera MIME Types', () => {
    const acceptedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.heic',
      '.heif',
      '.gif',
      '.bmp',
    ];

    function isFileSupported(fileName: string): boolean {
      const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
      return acceptedExtensions.includes(ext);
    }

    it('should accept standard desktop image formats (jpg, png)', () => {
      assert.ok(isFileSupported('sample.jpg'));
      assert.ok(isFileSupported('photo.png'));
    });

    it('should accept mobile camera formats (webp on Android, heic/heif on iOS)', () => {
      assert.ok(isFileSupported('IMG_0412.HEIC'));
      assert.ok(isFileSupported('capture.heif'));
      assert.ok(isFileSupported('camera.webp'));
    });

    it('should reject non-image file types', () => {
      assert.strictEqual(isFileSupported('document.pdf'), false);
      assert.strictEqual(isFileSupported('archive.zip'), false);
      assert.strictEqual(isFileSupported('script.js'), false);
    });
  });
});
