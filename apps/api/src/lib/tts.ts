import { exec, spawn } from 'node:child_process';

export async function tts(text: string, outputFile: string) {
  return new Promise((resolve, reject) => {
    exec(`say "${text}" -o "${outputFile}"`, (error) => {
      error ? reject(error) : resolve(outputFile);
    });
  });
}

export async function aiffToWav(inputFile: string, outputFile: string) {
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -i "${inputFile}" -acodec pcm_s16le -ar 44100 "${outputFile}"`,
      (error) => {
        error ? reject(error) : resolve(outputFile);
      }
    );
  });
}
