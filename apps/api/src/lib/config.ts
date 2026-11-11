import 'dotenv/config';

export const config = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  PORT: Number(process.env.PORT) || 8080,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '',
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
};
