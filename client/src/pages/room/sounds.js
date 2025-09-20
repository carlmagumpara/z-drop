import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import useInteraction from '@/hooks/use-interaction';
import whoopSfx from '@/assets/simple-whoosh-382724.mp3';
import popSfx from '@/assets/pop-402324.mp3';
import messageNotificationSfx from '@/assets/message-notification-190034.mp3';
import bubbleSfx from '@/assets/bubble-254777.mp3';
import messageSfx from '@/assets/message-envoye-iphone-apple-391098.mp3';

const soundModules = import.meta.glob('@/assets/sounds/*.{mp3, m4a}', { 
  eager: true, 
  as: 'url' 
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

  console.log(sounds.current);

  return sounds.current;
}

export {
  whoopSfx,
  popSfx,
  messageNotificationSfx,
  bubbleSfx,
  messageSfx
}