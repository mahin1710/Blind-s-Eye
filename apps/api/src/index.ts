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
    origin: ['http://localhost:5173'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    maxAge: 3600,
  })
);

app.get('/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime() });
});

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
  c.header('Cache-Control', 'no-cache');
  c.header('Transfer-Encoding', 'chunked');

  return stream(c, async (stream) => {
    let outputFile = '';
    let wavFile = '';
    try {
      const isWin = process.platform === 'win32';
      outputFile = path.join(os.tmpdir(), crypto.randomUUID() + (isWin ? '.wav' : '.aiff'));
      await tts(text, outputFile);

      wavFile = isWin ? outputFile : path.join(os.tmpdir(), crypto.randomUUID() + '.wav');
      if (!isWin) {
        await aiffToWav(outputFile, wavFile);
      }

      if (fs.existsSync(wavFile)) {
        const readableStream = fs.createReadStream(wavFile);
        for await (const chunk of readableStream) {
          stream.write(chunk);
        }
      }
    } catch (err) {
      console.error('TTS synthesis error:', err);
    } finally {
      if (outputFile && fs.existsSync(outputFile)) {
        try {
          fs.unlinkSync(outputFile);
        } catch {}
      }
      if (wavFile && wavFile !== outputFile && fs.existsSync(wavFile)) {
        try {
          fs.unlinkSync(wavFile);
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
