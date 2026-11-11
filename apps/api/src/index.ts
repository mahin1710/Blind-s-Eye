import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { z } from 'zod';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { zValidator } from '@hono/zod-validator';
import { cors } from 'hono/cors';
import { formatDataForStream, streamTextFromImage } from './lib/ai';
import { stream, streamText } from 'hono/streaming';
import { aiffToWav, tts } from './lib/tts';
import { config } from './lib/config';

const app = new Hono().use(
  cors({
    origin: (origin) => {
      // In dev or local environments, permit localhost, LAN IPs, or configured origin
      if (!origin) return '*';
      if (
        config.CORS_ORIGIN &&
        (origin === config.CORS_ORIGIN || config.CORS_ORIGIN === '*')
      ) {
        return origin;
      }
      if (
        /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)
      ) {
        return origin;
      }
      // Allow private / local area networks for mobile / tablet testing over Wi-Fi
      if (
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(
          origin
        )
      ) {
        return origin;
      }
      return origin;
    },
    allowHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept'],
    exposeHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 3600,
  })
);

app.get('/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime() });
});

// In-memory cache map for synthesized audio to prevent redundant TTS synthesis
const audioCache = new Map<string, string>();

app.post(
  '/signed-url',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1),
      size: z.number().positive(),
      type: z.string().startsWith('image/'),
    })
  ),
  async (c) => {
    const { name, type } = c.req.valid('json');
    const fileKey = `uploads/${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Return structured presigned upload descriptor
    return c.json({
      url: `/upload/${fileKey}`,
      key: fileKey,
      mimeType: type,
    });
  }
);

app.post(
  '/describe',
  zValidator(
    'form',
    z.object({
      image: z.instanceof(File),
    })
  ),
  async (c) => {
    const { image } = c.req.valid('form');
    const arrayBuffer = await image.arrayBuffer();

    const result = streamTextFromImage(arrayBuffer);

    return streamText(c, async (stream) => {
      for await (const chunk of result.textStream) {
        stream.write(formatDataForStream('message', chunk));
      }
    });
  }
);

async function handleSpeakRequest(c: any, text: string) {
  c.header('Content-Type', 'audio/wav');
  c.header('Content-Disposition', 'inline; filename="audio.wav"');
  c.header('Cache-Control', 'public, max-age=86400');
  c.header('Transfer-Encoding', 'chunked');

  const textHash = crypto.createHash('md5').update(text.trim()).digest('hex');
  const cachedPath = audioCache.get(textHash);

  if (cachedPath && fs.existsSync(cachedPath)) {
    return stream(c, async (stream) => {
      const readableStream = fs.createReadStream(cachedPath);
      for await (const chunk of readableStream) {
        stream.write(chunk);
      }
    });
  }

  return stream(c, async (stream) => {
    let outputFile = '';
    let wavFile = '';
    try {
      const isWin = process.platform === 'win32';
      outputFile = path.join(
        os.tmpdir(),
        crypto.randomUUID() + (isWin ? '.wav' : '.aiff')
      );
      await tts(text, outputFile);

      wavFile = isWin
        ? outputFile
        : path.join(os.tmpdir(), crypto.randomUUID() + '.wav');
      if (!isWin) {
        await aiffToWav(outputFile, wavFile);
      }

      if (fs.existsSync(wavFile)) {
        // Cache the synthesized file for subsequent identical queries
        audioCache.set(textHash, wavFile);

        const readableStream = fs.createReadStream(wavFile);
        for await (const chunk of readableStream) {
          stream.write(chunk);
        }
      }
    } catch (err) {
      console.error('TTS synthesis error:', err);
    } finally {
      if (outputFile && outputFile !== wavFile && fs.existsSync(outputFile)) {
        try {
          fs.unlinkSync(outputFile);
        } catch {}
      }
    }
  });
}

app.get(
  '/speak',
  zValidator(
    'query',
    z.object({
      text: z.string().min(1),
    })
  ),
  async (c) => {
    const { text } = c.req.valid('query');
    return handleSpeakRequest(c, text);
  }
);

app.post(
  '/speak',
  zValidator(
    'query',
    z.object({
      text: z.string().min(1),
    })
  ),
  async (c) => {
    const { text } = c.req.valid('query');
    return handleSpeakRequest(c, text);
  }
);

const port = config.PORT;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  }
);
