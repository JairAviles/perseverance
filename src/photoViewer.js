import './photoViewer.css';

const DISPLAY_MS = 7000;
const REVEAL_MS = 2500;
const DAY_MS = 86400000;

function createElement(tag, className, text = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function getDaysAgo(takenAt) {
  const days = Math.floor((Date.now() - Date.parse(takenAt)) / DAY_MS);
  if (days < 1) return 'today';
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

// Two quick bursts of filtered noise: the blades closing and opening
function playShutter(audio) {
  const length = audio.sampleRate * 0.05;
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;

  [0, 0.09].forEach((delay) => {
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    gain.gain.value = 0.6;
    source.connect(filter).connect(gain).connect(audio.destination);
    source.start(audio.currentTime + delay);
  });
}

export function createPhotoViewer() {
  const flash = createElement('div', 'photo-flash');
  const viewer = createElement('div', 'photo-viewer');
  const card = createElement('figure', 'photo-card');
  const frame = createElement('div', 'photo-frame');
  const image = createElement('img', 'photo-image');
  const status = createElement('span', 'photo-status', 'Receiving from Mars…');
  const caption = createElement('figcaption', 'photo-caption');
  const details = createElement('span', 'photo-details');
  const hint = createElement('span', 'photo-hint');
  image.alt = '';
  frame.append(image, status);
  caption.append(details, hint);
  card.append(frame, caption);
  viewer.append(card);
  viewer.hidden = true;
  document.body.append(viewer, flash);

  let camera = null;
  let index = 0;
  let closeTimer = 0;
  let revealTimer = 0;
  let audio = null;

  function close() {
    clearTimeout(closeTimer);
    viewer.hidden = true;
    viewer.classList.remove('is-full');
  }

  function keepOpen() {
    clearTimeout(closeTimer);
    if (!viewer.classList.contains('is-full')) closeTimer = setTimeout(close, DISPLAY_MS + REVEAL_MS);
  }

  function showPhoto() {
    const photo = camera.photos[index];
    clearTimeout(revealTimer);
    viewer.dataset.ready = 'false';
    image.classList.remove('is-revealed');
    status.hidden = false;
    details.textContent = `${camera.name} · Sol ${photo.sol} · ${getDaysAgo(photo.takenAt)}`;
    hint.textContent = `${index + 1}/${camera.photos.length} · ← → more · ${viewer.classList.contains('is-full') ? 'Esc to return' : 'click to enlarge'}`;
    image.src = photo.url;
    keepOpen();
  }

  // The photo comes down line by line, blurry at first, like a downlink
  image.addEventListener('load', () => {
    status.hidden = true;
    requestAnimationFrame(() => image.classList.add('is-revealed'));
    revealTimer = setTimeout(() => (viewer.dataset.ready = 'true'), REVEAL_MS);
  });
  image.addEventListener('error', () => {
    status.textContent = 'Signal lost';
    console.error(`Photo failed to load: ${image.src}`);
  });

  card.addEventListener('click', () => {
    viewer.classList.add('is-full');
    clearTimeout(closeTimer);
    hint.textContent = `${index + 1}/${camera.photos.length} · ← → more · Esc to return`;
  });

  window.addEventListener('keydown', (event) => {
    if (viewer.hidden) return;
    if (event.code === 'Escape') close();
    if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
      const step = event.code === 'ArrowRight' ? 1 : -1;
      index = (index + step + camera.photos.length) % camera.photos.length;
      showPhoto();
    }
  });

  function show(config) {
    audio ??= new AudioContext();
    playShutter(audio);
    flash.classList.remove('is-flashing');
    void flash.offsetWidth;
    flash.classList.add('is-flashing');

    camera = config;
    index = 0;
    viewer.classList.remove('is-full');
    viewer.hidden = false;
    showPhoto();
  }

  return { show, close };
}
