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

const app = new Hono().use(
  cors({
    origin: ['http://localhost:5173'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    // it will cache the preflight request for 1 hour
    // so we don't need to send the preflight request for each request
    maxAge: 3600,
  })
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

    c.header('Content-Type', 'audio/wav');
    c.header('Content-Disposition', 'attachment; filename="audio.wav"');
    c.header('Cache-Control', 'no-cache');
    c.header('Transfer-Encoding', 'chunked');

    return stream(c, async (stream) => {
      const outputFile = path.join(os.tmpdir(), crypto.randomUUID() + '.aiff');
      await tts(text, outputFile);
      const wavFile = path.join(os.tmpdir(), crypto.randomUUID() + '.wav');
      await aiffToWav(outputFile, wavFile);

      const readableStream = fs.createReadStream(wavFile);
      for await (const chunk of readableStream) {
        stream.write(chunk);
      }

      fs.unlinkSync(outputFile);
      fs.unlinkSync(wavFile);
    });
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

    c.header('Content-Type', 'audio/wav');
    c.header('Content-Disposition', 'attachment; filename="audio.wav"');
    c.header('Cache-Control', 'no-cache');
    c.header('Transfer-Encoding', 'chunked');

    return stream(c, async (stream) => {
      const outputFile = path.join(os.tmpdir(), crypto.randomUUID() + '.aiff');
      await tts(text, outputFile);
      const wavFile = path.join(os.tmpdir(), crypto.randomUUID() + '.wav');
      await aiffToWav(outputFile, wavFile);

      const readableStream = fs.createReadStream(wavFile);
      for await (const chunk of readableStream) {
        stream.write(chunk);
      }

      fs.unlinkSync(outputFile);
      fs.unlinkSync(wavFile);
    });
  }
);

serve(
  {
    fetch: app.fetch,
    port: 8080,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
