import {
  type ImagePart,
  streamText,
  experimental_generateSpeech as generateSpeech,
} from 'ai';
import { HTTPException } from 'hono/http-exception';
import { createOllama } from 'ollama-ai-provider';

const ollama = createOllama({
  baseURL: 'http://localhost:11434/api',
});

export function streamTextFromImage(image: ImagePart['image']) {
  try {
    return streamText({
      model: ollama('llava:7b'),
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
  } catch (error) {
    console.error(error);
    throw new HTTPException(500, {
      message: 'Failed to generate text from image',
    });
  }
}

export function tts(text: string) {
  try {
    if (!ollama.speechModel) {
      throw new HTTPException(500, {
        message: 'No speech model found',
      });
    }

    return generateSpeech({
      model: ollama.speechModel('566f61870856'),
      text,
      voice: 'tara',
      instructions:
        'Speak in a cheerful and positive tone. Speak in a way that is easy to understand for blind people.',
    });
  } catch (error) {
    console.error(error);
    throw new HTTPException(500, {
      message: 'Failed to generate speech',
    });
  }
}

export const CHAT_RESPONSE_PREFIX = {
  message: '0',
  details: 'd',
} as const;

type ChatResponseType = keyof typeof CHAT_RESPONSE_PREFIX;

export function formatDataForStream(type: ChatResponseType, data: any) {
  const prefix = CHAT_RESPONSE_PREFIX[type];
  // we stringify the data to avoid the issue of the chunk being split into multiple lines
  // because the chunk is a stream of data and it is not guaranteed to be a single line
  return `${prefix}:${JSON.stringify(data)}\n`;
}
