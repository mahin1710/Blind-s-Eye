import {
  AlertCircleIcon,
  Loader2Icon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from 'lucide-react';
import type { Route } from './+types/_index';
import {
  useDropzone,
  type DropEvent,
  type FileRejection,
} from 'react-dropzone';
import { cn } from '~/utils/classname';
import { useCallback, useEffect, useState } from 'react';
import { useCompletion } from '~/hooks/use-completion';
import { useStreamAudio } from '~/hooks/use-stream-audio';
import { useServiceWorker } from '~/hooks/use-service-worker';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "PicTalk AI — Blind's Eye" },
    {
      name: 'description',
      content:
        'PicTalk AI: AI-Powered Image Transcription for Enhanced Visual Accessibility',
    },
  ];
}

type OnDrop<T extends File = File> = (
  acceptedFiles: T[],
  fileRejections: FileRejection[],
  event: DropEvent
) => void;

type FileWithPreview = File & { preview?: string };

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function IndexPage() {
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [file, setFile] = useState<FileWithPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useServiceWorker('/worker.js');

  const { isPlaying, isAudioLoading, play, clear } = useStreamAudio();

  const handleCompletionError = useCallback((error: Error) => {
    console.error('Completion error:', error);
    setErrorMessage(
      error.message ||
        'Failed to connect to the vision AI server. Please verify the API is running.'
    );
  }, []);

  const { completion, sendCompletion, status, reset } = useCompletion({
    endpoint: `${API_BASE_URL}/describe`,
    onError: handleCompletionError,
  });

  const onDrop: OnDrop = useCallback((acceptedFiles, rejections) => {
    setErrorMessage(null);
    if (rejections.length > 0) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP, HEIC).');
      return;
    }
    const firstFile = acceptedFiles[0];
    if (!firstFile) return;

    const preview = URL.createObjectURL(firstFile);
    Object.assign(firstFile, { preview });
    setRawFile(firstFile);
    setFile(firstFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.heic',
        '.heif',
        '.gif',
        '.bmp',
      ],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleImageDescribe = useCallback(async () => {
    if (!rawFile || isAudioLoading) {
      return;
    }

    setErrorMessage(null);
    if (isPlaying) {
      clear();
    }

    const formData = new FormData();
    formData.append('image', rawFile);

    const result = await sendCompletion('', {
      body: formData,
    });

    if (!result) {
      return;
    }

    const url = new URL('/speak', API_BASE_URL);
    url.searchParams.append('text', result);
    play(url.toString());
  }, [rawFile, isAudioLoading, isPlaying, clear, sendCompletion, play]);

  useEffect(() => {
    return () => {
      if (!file || !file.preview) {
        return;
      }
      URL.revokeObjectURL(file.preview);
    };
  }, [file]);

  const handleRemove = useCallback(() => {
    setFile(null);
    setRawFile(null);
    setErrorMessage(null);
    clear();
    reset();
  }, [clear, reset]);

  const title = (
    <header className="text-center">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
        Describe an image
      </h1>
      <p className="mt-2 text-balance text-center text-sm text-zinc-500">
        Upload an image and let the image describe itself.
      </p>
    </header>
  );

  return (
    <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-12 flex flex-col justify-start">
      {title}

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
        >
          <AlertCircleIcon className="size-5 shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Notice</p>
            <p className="mt-0.5 text-xs text-red-700 leading-relaxed">
              {errorMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs text-red-600 hover:text-red-900 underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {!file ? (
        <section
          aria-label="Image upload area"
          className="mt-6 sm:mt-8 flex flex-col"
        >
          <div
            {...getRootProps({
              role: 'button',
              tabIndex: 0,
              'aria-label':
                'Upload an image. Drag and drop file here, or tap to choose from your device or camera',
              className: cn(
                'border-[1.5px] border-dashed border-zinc-200 min-h-56 sm:min-h-64 flex items-center justify-center rounded-2xl p-6 bg-zinc-50 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
                isDragActive && 'border-zinc-400 bg-zinc-100/70'
              ),
            })}
          >
            <input {...getInputProps()} />
            <div className="max-w-xs mx-auto flex flex-col items-center text-balance text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200/80 mb-3">
                <PlusIcon className="size-5 text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-700">
                Tap to upload or take a photo
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                or drag and drop your image here
              </p>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-zinc-400">
            Supports JPG, PNG, WebP, and HEIC images
          </p>
        </section>
      ) : (
        <section
          aria-label="Image preview and transcription"
          className="mt-6 sm:mt-8 flex flex-col"
        >
          {/* Responsive image preview that preserves natural aspect ratio */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-h-[340px] sm:max-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100/70 p-2">
              <img
                src={file.preview}
                alt={file.name || 'Selected image to describe'}
                className="max-h-[320px] sm:max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-xs"
              />
            </div>
          </div>

          {/* Description container with aria-live for screen readers */}
          {completion && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                Audio Description
              </span>
              <p className="text-sm sm:text-base text-zinc-800 leading-relaxed break-words">
                {completion}
              </p>
            </div>
          )}

          {/* Action buttons with minimum 44px-48px touch targets */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <button
              type="button"
              aria-label="Remove image and reset"
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-medium tracking-wide text-zinc-600 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-zinc-400"
              onClick={handleRemove}
            >
              <TrashIcon className="size-4 shrink-0" />
              <span>Remove</span>
            </button>

            <button
              type="button"
              aria-label={
                isPlaying
                  ? 'Stop spoken description'
                  : isAudioLoading || status === 'loading' || status === 'streaming'
                  ? 'Generating description and audio'
                  : 'Describe image and play audio'
              }
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium tracking-wide text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
              disabled={isAudioLoading || status === 'loading' || status === 'streaming'}
              onClick={() => {
                if (isAudioLoading || isPlaying) {
                  clear();
                  return;
                }
                handleImageDescribe();
              }}
            >
              {(isAudioLoading || status === 'loading' || status === 'streaming') && !isPlaying ? (
                <>
                  <Loader2Icon className="size-4 shrink-0 animate-spin" />
                  <span>
                    {status === 'streaming'
                      ? 'Describing...'
                      : 'Processing image...'}
                  </span>
                </>
              ) : isPlaying ? (
                <>
                  <PauseIcon className="size-4 shrink-0" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <PlayIcon className="size-4 shrink-0" />
                  <span>Describe Image</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
