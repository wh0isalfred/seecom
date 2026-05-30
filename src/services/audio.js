// Global audio singleton — lives outside React, can be killed from anywhere
let _audio = null;

export const getAudio = () => {
  if (!_audio) {
    _audio = new Audio(new URL('./assets/music.mp3', import.meta.url).href);
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
};

export const destroyAudio = () => {
  if (_audio) {
    _audio.pause();
    _audio.currentTime = 0;
    _audio.src = '';
    _audio = null;
  }
};
