import { exec, execFile } from 'node:child_process';
import fs from 'node:fs';

export async function tts(text: string, outputFile: string): Promise<string> {
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows PowerShell SpeechSynthesizer natively creates WAV files without ffmpeg
    // Using base64 UTF-16LE encoded command prevents any quote, character, or path escaping issues
    const safeText = text.replace(/'/g, "''");
    const safePath = outputFile.replace(/'/g, "''");
    const psScript = [
      'Add-Type -AssemblyName System.Speech;',
      '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;',
      `$synth.SetOutputToWaveFile('${safePath}');`,
      `$synth.Speak('${safeText}');`,
      '$synth.Dispose();',
    ].join(' ');

    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');

    return new Promise((resolve, reject) => {
      execFile(
        'powershell.exe',
        ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(outputFile);
          }
        }
      );
    });
  }

  if (platform === 'darwin') {
    const sanitizedText = text.replace(/"/g, '\\"');
    return new Promise((resolve, reject) => {
      exec(`say "${sanitizedText}" -o "${outputFile}"`, (error) => {
        error ? reject(error) : resolve(outputFile);
      });
    });
  }

  // Linux: Try espeak / espeak-ng
  const sanitizedText = text.replace(/"/g, '\\"');
  return new Promise((resolve, reject) => {
    exec(`espeak -w "${outputFile}" "${sanitizedText}"`, (error) => {
      if (error) {
        exec(`espeak-ng -w "${outputFile}" "${sanitizedText}"`, (ngError) => {
          ngError ? reject(ngError) : resolve(outputFile);
        });
      } else {
        resolve(outputFile);
      }
    });
  });
}

export async function aiffToWav(
  inputFile: string,
  outputFile: string
): Promise<string> {
  // If inputFile is already a WAV file (e.g. on Windows), copy or rename
  if (inputFile.endsWith('.wav') || inputFile === outputFile) {
    if (inputFile !== outputFile && fs.existsSync(inputFile)) {
      fs.copyFileSync(inputFile, outputFile);
    }
    return outputFile;
  }

  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -y -i "${inputFile}" -acodec pcm_s16le -ar 44100 "${outputFile}"`,
      (error) => {
        if (error) {
          if (fs.existsSync(inputFile)) {
            try {
              fs.copyFileSync(inputFile, outputFile);
              return resolve(outputFile);
            } catch {
              // ignore
            }
          }
          reject(error);
        } else {
          resolve(outputFile);
        }
      }
    );
  });
}
