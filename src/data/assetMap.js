const base = import.meta.env.BASE_URL || '/';

export const ASSET_MAP = {
  hero: `${base}assets/placeholder/IRL_9695.jpg`,
  groom: `${base}assets/placeholder/surya-profile.jpg`,
  bride: `${base}assets/placeholder/dian-profile.jpg`,
  storyOne: `${base}assets/placeholder/story-2019.jpg`,
  storyTwo: `${base}assets/placeholder/story-beginning.jpg`,
  gallery: {
    IRL_9483: `${base}assets/placeholder/IRL_9483.jpg`,
    IRL_1228: `${base}assets/placeholder/IRL_1228.jpg`,
    IRL_9722: `${base}assets/placeholder/IRL_9722.jpg`,
    COUPLE_RED: `${base}assets/placeholder/couple-red.jpg`,
    IRL_9285: `${base}assets/placeholder/IRL_9285.jpg`,
    IRL_9887: `${base}assets/placeholder/IRL_9887.jpg`,
    COUPLE_GREEN: `${base}assets/placeholder/couple-green.jpg`,
    IRL_9800: `${base}assets/placeholder/IRL_9800.jpg`,
  },
  video: {
    teaser: `${base}assets/video/PREWEDDING%20SURYA%20%26%20DIAN%20TEASER.mp4`,
    poster: `${base}assets/placeholder/teaser-poster.jpg`,
  },
  audio: {
    music: `${base}assets/audio/Kamulah-Takdirku.mp3`,
  },
};

export const ASSET_NOTES = {
  summary:
    'Asset placeholders are intentionally staged. Add the real files to public/assets for a production-ready version of the invitation.',
  expectedFiles: [
    'public/assets/placeholder/IRL_9695.jpg',
    'public/assets/placeholder/surya-profile.jpg',
    'public/assets/placeholder/dian-profile.jpg',
    'public/assets/placeholder/story-2019.jpg',
    'public/assets/placeholder/story-beginning.jpg',
    'public/assets/placeholder/IRL_9483.jpg',
    'public/assets/placeholder/IRL_1228.jpg',
    'public/assets/placeholder/IRL_9722.jpg',
    'public/assets/placeholder/couple-red.jpg',
    'public/assets/placeholder/IRL_9285.jpg',
    'public/assets/placeholder/IRL_9887.jpg',
    'public/assets/placeholder/couple-green.jpg',
    'public/assets/placeholder/IRL_9800.jpg',
    'public/assets/placeholder/teaser-poster.jpg',
    'public/assets/video/PREWEDDING SURYA & DIAN TEASER.mp4',
    'public/assets/audio/Kamulah-Takdirku.mp3',
  ],
};
