import {
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
import { httpPost } from '~/utils/http';
import { useCompletion } from '~/hooks/use-completion';
import { useStreamAudio } from '~/hooks/use-stream-audio';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'PicTalk AI' },
    { name: 'description', content: 'PicTalk AI' },
  ];
}

type OnDrop<T extends File = File> = (
  acceptedFiles: T[],
  fileRejections: FileRejection[],
  event: DropEvent
) => void;

type FileWithPreview = File & { preview?: string };

export default function IndexPage() {
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [file, setFile] = useState<FileWithPreview | null>(null);

  const { completion, sendCompletion, status, reset } = useCompletion({
    endpoint: `${import.meta.env.VITE_API_URL}/describe`,
  });
  const { play, isPlaying, isAudioLoading, audioRef, clear } = useStreamAudio();

  const onDrop: OnDrop = useCallback((acceptedFiles) => {
    const firstFile = acceptedFiles[0];
    const preview = URL.createObjectURL(firstFile);
    Object.assign(firstFile, { preview });
    setRawFile(firstFile);
    setFile(firstFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.heic', '.heif'],
    },
  });

  const handleImageDescribe = useCallback(async () => {
    if (!rawFile || isAudioLoading) {
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        clear();
      }
    }

    const formData = new FormData();
    formData.append('image', rawFile);
    const result = await sendCompletion('', {
      headers: {},
      body: formData,
    });
    if (!result) {
      alert('Error generating audio');
      return;
    }

    const url = new URL('/speak', import.meta.env.VITE_API_URL);
    url.searchParams.append('text', result);
    const audioUrl = url.toString();

    play(audioUrl);
  }, [rawFile]);

  useEffect(() => {
    return () => {
      if (!file || !file.preview) {
        return;
      }

      URL.revokeObjectURL(file.preview);
    };
  }, [file]);

  const title = (
    <>
      <h2 className="text-center text-3xl">Describe an image</h2>
      <p className="mt-2 text-balance text-center text-sm text-zinc-500">
        Upload an image and let the image describe itself.
      </p>
    </>
  );

  if (!file) {
    return (
      <section className="mx-auto mt-10 flex max-w-md flex-col">
        {title}

        <div
          {...getRootProps({
            className: cn(
              'border-[1.5px] border-dashed border-zinc-200 min-h-60 flex items-center justify-center rounded-xl p-4 mt-8 bg-zinc-50',
              isDragActive && 'border-zinc-400'
            ),
          })}
        >
          <input {...getInputProps()} />
          <div className="max-w-2xs mx-auto flex flex-col items-center text-balance text-center">
            <PlusIcon className="size-5 text-zinc-400" />
            <p className="mt-3 text-zinc-500">
              Drag and drop your files here or{' '}
              <span className="text-black">click to browse</span>
            </p>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-zinc-400">
          Only image files are supported at the moment
        </p>
      </section>
    );
  }

  const isInfoLoading = status !== 'idle' && status !== 'error';

  return (
    <section className="mx-auto mt-10 flex max-w-md flex-col">
      {title}

      <div className="mt-8 flex items-center justify-center">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={file.preview}
            alt={file.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>

      {completion && (
        <div className="mt-4">
          <p>{completion}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-100 p-1 py-2.5 leading-none tracking-wide text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-400 data-[loading=true]:cursor-wait"
          onClick={() => {
            setFile(null);
            setRawFile(null);
            clear();
            reset();
          }}
        >
          <TrashIcon className="size-4" />
          Remove
        </button>
        <button
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-100 p-1 py-2.5 leading-none tracking-wide text-zinc-600 transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-400 data-[loading=true]:cursor-wait"
          disabled={isAudioLoading || isInfoLoading}
          onClick={() => {
            if (isAudioLoading || isPlaying) {
              clear();
              return;
            }

            handleImageDescribe();
          }}
        >
          {isAudioLoading && !isPlaying && (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Generating audio...</span>
            </>
          )}

          {!isAudioLoading && !isPlaying && !isInfoLoading && (
            <>
              <PlayIcon className="size-4" />
              <span>Describe Image</span>
            </>
          )}

          {!isAudioLoading && !isPlaying && isInfoLoading && (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Generating audio...</span>
            </>
          )}

          {!isAudioLoading && isPlaying && (
            <>
              <PauseIcon className="size-4" />
              <span>Done</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

type PresignedDetails = {
  url: string;
  key: string;
};

async function getPresignedDetails(
  name: string,
  type: string,
  size: number
): Promise<PresignedDetails> {
  return httpPost<PresignedDetails>('/signed-url', {
    name,
    size,
    type,
  });
}
