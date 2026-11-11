import { type ImagePart, streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ollama = createOllama({
  baseURL: 'http://localhost:11434/api',
});

function streamTextFromImage(model: string, image: ImagePart['image']) {
  return streamText({
    model: ollama(model),
    system:
      'You are great at describing images. You are given an image and you need to describe it in a way that is easy to understand for blind people. Keep the description short and concise. Do not include any other text than the description.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image,
          },
        ],
      },
    ],
  });
}

const imagesPath = path.join(__dirname, '../data/images');
const images = await fs.readdir(imagesPath);

console.log(`Found ${images.length} images`);

const models = ['qwen2.5vl:3b', 'gemma3:4b', 'llava:7b'];

type ModelResult = {
  model: string;
  avgDurationPerImage: number;
  avgTokensPerSecond: number;
  result: {
    [image: string]: {
      duration: number;
      tokens: number;
      result: string;
    };
  };
};
const results: ModelResult[] = [];

for (const model of models) {
  console.log(`Testing ${model}`);
  const start = performance.now();

  let tokens = 0;
  let imageResults: ModelResult['result'] = {};
  for (const image of images) {
    console.log(`Testing Image ${image} with ${model}`);
    const imagePath = path.join(imagesPath, image);
    const imageBuffer = await fs.readFile(imagePath);

    const startImage = performance.now();
    const stream = streamTextFromImage(model, imageBuffer);

    let result = '';
    for await (const chunk of stream.textStream) {
      result += chunk;
    }

    const endImage = performance.now();
    const durationImage = (endImage - startImage) / 1000; // to seconds
    const imageTokens = await stream.usage;
    tokens += imageTokens.totalTokens;

    imageResults[image] = {
      duration: durationImage,
      tokens: imageTokens.totalTokens,
      result,
    };

    console.log(`Finished testing Image ${image} with ${model}`);
  }

  const end = performance.now();
  const duration = (end - start) / 1000; // to seconds
  const averageDuration = duration / images.length;
  const avgTokensPerSecond = tokens / duration;
  console.log(`${model} took ${duration}s (${averageDuration}s per image)`);
  console.log(
    `${model} consumed ${tokens} tokens (${avgTokensPerSecond} tokens per second)`
  );

  results.push({
    model,
    avgDurationPerImage: averageDuration,
    avgTokensPerSecond,
    result: imageResults,
  });

  console.log(`Finished testing ${model}`);
  console.log('--------------------------------');
}

const rows = [];
for (const result of results) {
  rows.push({
    model: result.model,
    'Avg Duration Per Image': result.avgDurationPerImage,
    'Avg Tokens Per Second': result.avgTokensPerSecond,
  });
}
console.table(rows);
const resultsPath = path.join(__dirname, '../data/results.json');
await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));

const imageRows = [];
for (const image of images) {
  for (const result of results) {
    const imageResult = result.result[image];
    if (!imageResult) {
      continue;
    }

    imageRows.push({
      image,
      model: result.model,
      duration: imageResult.duration,
      tokens: imageResult.tokens,
      result: imageResult.result,
    });
  }
}
console.table(imageRows);
const imageResultsPath = path.join(__dirname, '../data/image-results.json');
await fs.writeFile(imageResultsPath, JSON.stringify(imageRows, null, 2));
