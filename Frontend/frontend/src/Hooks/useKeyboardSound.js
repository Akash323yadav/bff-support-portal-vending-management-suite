import { useEffect, useRef } from "react";

/**
 * Hook to play a sound on every keystroke.
 * @param {string} soundPath - Path to the audio file
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @param {number} speed - Playback speed (default: 0.06)
 */
const useKeyboardSound = (soundPath, volume = 0.5, speed = 0.06) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!soundPath) return;

    audioRef.current = new Audio(soundPath);
    audioRef.current.volume = volume;
    audioRef.current.preload = "auto";

    const handleKeyDown = () => {
      if (!audioRef.current) return;

      // Clone for overlapping sounds
      const sound = audioRef.current.cloneNode(true);
      sound.volume = volume;
      sound.playbackRate = speed;
      sound.currentTime = 0;

      sound.play().catch(() => {});
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [soundPath, volume, speed]);
};

export default useKeyboardSound;
