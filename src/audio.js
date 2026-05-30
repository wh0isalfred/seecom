// Global audio singleton — lives outside React, can be killed from anywhere
let _audio = null;

const clearMediaSession = () => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
    // Remove all hardware control handlers so AirPods/headphones can't resume
    ['play', 'pause', 'stop'].forEach(action => {
      try { navigator.mediaSession.setActionHandler(action, null); } catch {}
    });
  }
};

export const getAudio = () => {
  if (!_audio) {
    _audio = new Audio(new URL('./assets/music.mp4', import.meta.url).href);
    _audio.loop = true;
    _audio.volume = 0.3;
    _audio.preload = 'auto';
  }
  return _audio;
};

export const stopAudio = () => {
  if (_audio) {
    _audio.pause();
    _audio.currentTime = 0;
  }
  clearMediaSession();
};

export const destroyAudio = () => {
  if (_audio) {
    _audio.pause();
    _audio.currentTime = 0;
    _audio.src = '';
    _audio = null;
  }
  clearMediaSession();
};
