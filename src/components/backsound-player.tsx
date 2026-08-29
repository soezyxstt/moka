// components/BacksoundPlayer.tsx
"use client"; // This directive marks it as a Client Component

import React, { useEffect } from 'react';
import useSound from 'use-sound';

// Path to your background music file in the public directory
const backgroundMusicPath = '/audio/pamoka.mp3';

const BacksoundPlayer: React.FC = () => {
  const [play, { stop, sound }] = useSound(backgroundMusicPath, {
    volume: 0.2, // Adjust desired volume (this will be applied when unmuted by user interaction)
    loop: true, // Loop the background music indefinitely
    muted: true, // IMPORTANT: Start muted to comply with autoplay policies
    onload: () => {
      // Callback when the sound is loaded and ready to play
      console.log('Background music loaded.');
      // Attempt to play it muted. This should succeed.
      if (sound) { // Ensure sound object exists
        sound.play();
        console.log('Background music started (muted).');
      }
    },
  });

  // Effect to handle initial play attempt and cleanup
  useEffect(() => {
    // This useEffect ensures the sound starts playing (muted) when the component mounts.
    // The `onload` callback above also contributes to this.
    // If the sound is already loaded when the component mounts, play() will be called.
    if (sound && !sound.playing()) {
      // sound.mute(true); 
      sound.play();
      console.log('Initial play attempt (muted) from useEffect.');
    }

    // Clean up function to stop the sound when the component unmounts (e.g., page change)
    return () => {
      if (sound) {
        stop();
        console.log('Background music stopped on unmount.');
      }
    };
  }, [play, stop, sound]); // Dependencies for useEffect

  // This component renders nothing visible
  return null;
};

export default BacksoundPlayer;