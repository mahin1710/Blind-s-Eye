import { useCallback, useEffect, useRef, useState } from 'react';

export function useStreamAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState(false);

  // Stop any playing audio or speech synthesis
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && audioRef.current.src) {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsAutoplayBlocked(false);
        })
        .catch((err) => {
          console.warn('Audio resume blocked:', err);
        });
      return;
    }
    if (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      window.speechSynthesis.paused
    ) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  }, []);

  const clear = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    speechUtteranceRef.current = null;
    setIsPlaying(false);
    setIsAudioLoading(false);
    setIsAutoplayBlocked(false);
  }, []);

  // Native Web Speech API fallback for browsers where backend TTS is unavailable or blocked
  const speakTextWithSpeechSynthesis = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return false;
    }

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      speechUtteranceRef.current = utterance;

      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsAudioLoading(false);
        setIsAutoplayBlocked(false);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        speechUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        setIsPlaying(false);
        setIsAudioLoading(false);
        speechUtteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('Speech synthesis exception:', err);
      return false;
    }
  }, []);

  const play = useCallback(
    (url: string, fallbackText?: string) => {
      clear();
      setIsAudioLoading(true);
      setIsAutoplayBlocked(false);

      const audio = new Audio();
      audio.preload = 'auto';
      audioRef.current = audio;

      audio.onerror = () => {
        console.warn(
          'Remote audio failed to load. Attempting browser speech synthesis fallback...'
        );
        if (fallbackText) {
          const spoke = speakTextWithSpeechSynthesis(fallbackText);
          if (spoke) return;
        }
        setIsPlaying(false);
        setIsAudioLoading(false);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setIsAudioLoading(false);
      };

      audio.onplay = () => {
        setIsPlaying(true);
        setIsAudioLoading(false);
        setIsAutoplayBlocked(false);
      };

      audio.src = url;

      // Explicitly call play() with promise handling for iOS Safari and mobile Chrome
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsAudioLoading(false);
            setIsAutoplayBlocked(false);
          })
          .catch((error) => {
            console.warn(
              'Audio play request failed or was prevented by browser policy:',
              error
            );
            setIsAudioLoading(false);
            // If autoplay is blocked by browser policy, flag it so user can tap to listen
            if (error.name === 'NotAllowedError') {
              setIsAutoplayBlocked(true);
            } else if (fallbackText) {
              // If network/format failed, attempt speech synthesis
              speakTextWithSpeechSynthesis(fallbackText);
            }
          });
      }
    },
    [clear, speakTextWithSpeechSynthesis]
  );

  // Clean up audio on unmount to avoid leaks
  useEffect(() => {
    return () => {
      clear();
    };
  }, [clear]);

  return {
    isPlaying,
    isAudioLoading,
    isAutoplayBlocked,
    play,
    stop,
    pause,
    resume,
    audioRef,
    clear,
    speakTextWithSpeechSynthesis,
  };
}
