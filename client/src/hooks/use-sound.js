import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import useInteraction from './use-interaction';

export default function useAudio(soundPath) {
  const hasInteracted = useInteraction();
  const audioRef = useRef();

  useEffect(() => {
    if (!hasInteracted) {
      return;
    }

    let audio = new Howl({ src: soundPath });
    audioRef.current = audio;

    return () => audio.unload();
  }, [hasInteracted, soundPath]);

  const play = () => audioRef.current?.play()

  return [play];
}