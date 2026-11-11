import { useCallback, useRef, useState } from 'react';

export function useStreamAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.play();
    setIsPlaying(true);
  }, []);

  const play = useCallback((url: string) => {
    let audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        setIsAudioLoading(false);
        audioRef.current = null;
      }
    }

    setIsAudioLoading(true);
    audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    audio.onerror = () => {
      setIsPlaying(false);
      setIsAudioLoading(false);
    };

    audio.onpause = () => {
      setIsPlaying(false);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onplay = () => {
      setIsPlaying(true);
      setIsAudioLoading(false);
    };

    audio.autoplay = true;
    audio.src = url;
  }, []);

  const clear = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setIsAudioLoading(false);
  }, []);

  return {
    isPlaying,
    isAudioLoading,
    play,
    stop,
    pause,
    resume,
    audioRef,
    clear,
  };
}
