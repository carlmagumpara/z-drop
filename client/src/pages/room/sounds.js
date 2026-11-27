import { useEffect, useRef } from 'react';
import useInteraction from '@/hooks/use-interaction';
import { Howl } from 'howler';

const soundModules = import.meta.glob('@/assets/sounds/*.{mp3, m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
});

export default function useSound() {
  const hasInteracted = useInteraction();
  const sounds = useRef({});

  useEffect(() => {
    if (!hasInteracted) {
      return;
    }

    Object.keys(soundModules).map(item => {
      const audio = new Howl({ src: soundModules[item] });
      const name = item.split("/").pop().replace(/\..+$/, "").replace(/[-_\d]+/g, "");
      sounds.current[name] = audio;
    });

    return () => {
      Object.keys(sounds.current).map(item => {
        sounds.current[item].unload()
      });
    };
  }, [hasInteracted]);

  return sounds.current;
}