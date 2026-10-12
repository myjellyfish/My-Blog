const shell = document.querySelector('.site-shell');

function fitShell() {
  if (window.matchMedia('(max-width: 760px)').matches) {
    document.documentElement.style.setProperty('--scale', '1');
    return;
  }
  const scale = Math.min((window.innerWidth - 28) / 1260, (window.innerHeight - 24) / 1040, 1);
  document.documentElement.style.setProperty('--scale', Math.max(scale, 0.28).toFixed(4));
}

fitShell();
window.addEventListener('resize', fitShell);

const dialog = document.querySelector('#construction-dialog');
const openDialog = document.querySelector('#open-construction');
const closeButtons = [document.querySelector('#close-construction'), document.querySelector('#confirm-construction')];

function showConstruction() {
  dialog.hidden = false;
  document.querySelector('#confirm-construction').focus();
}

function hideConstruction() {
  dialog.hidden = true;
  openDialog.focus();
}

openDialog.addEventListener('click', showConstruction);
closeButtons.forEach((button) => button.addEventListener('click', hideConstruction));
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) hideConstruction();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !dialog.hidden) hideConstruction();
});

const clock = document.querySelector('#beijing-clock');
const dateLabel = document.querySelector('#beijing-date');
const monthLabel = document.querySelector('#calendar-month');
const calendarGrid = document.querySelector('#calendar-grid');
let renderedMonth = '';

function beijingParts() {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function renderCalendar(year, month, today) {
  const key = `${year}-${month}-${today}`;
  if (renderedMonth === key) return;
  renderedMonth = key;
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  calendarGrid.replaceChildren();
  for (let i = 0; i < firstWeekday; i += 1) {
    const blank = document.createElement('span');
    blank.className = 'calendar-day is-empty';
    calendarGrid.append(blank);
  }
  for (let day = 1; day <= days; day += 1) {
    const cell = document.createElement('span');
    cell.className = `calendar-day${day === today ? ' is-today' : ''}`;
    cell.textContent = day;
    if (day === today) cell.setAttribute('aria-current', 'date');
    calendarGrid.append(cell);
  }
}

function updateClock() {
  const parts = beijingParts();
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  clock.textContent = `${parts.hour}:${parts.minute}`;
  dateLabel.textContent = `${year}年${month}月${day}日`;
  monthLabel.textContent = `${year}年 ${month}月`;
  renderCalendar(year, month, day);
}

updateClock();
setInterval(updateClock, 1000);

const playButton = document.querySelector('#play-button');
const progress = document.querySelector('#progress');
const timeLabel = document.querySelector('#time-label');
const musicHint = document.querySelector('#music-hint');
const audio = document.querySelector('#audio');
let audioRequested = false;

function requestAudio() {
  if (audioRequested) return;
  audioRequested = true;
  audio.src = audio.dataset.src;
  audio.load();
  musicHint.textContent = 'TSUKINOSORA · 正在加载音乐...';
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function syncMusicProgress() {
  const current = audio.currentTime || 0;
  const duration = audio.duration || 0;
  const ratio = duration ? (current / duration) * 100 : 0;
  progress.value = ratio;
  progress.style.setProperty('--progress', `${ratio}%`);
  timeLabel.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
}

function setPlaying(playing) {
  playButton.classList.toggle('is-playing', playing);
  playButton.setAttribute('aria-label', playing ? '暂停 Luv Letter' : '播放 Luv Letter');
  musicHint.textContent = playing ? 'TSUKINOSORA · 正在播放' : 'TSUKINOSORA · 本地音乐';
  syncMusicProgress();
}

playButton.addEventListener('click', async () => {
  requestAudio();
  if (audio.paused) {
    try {
      await audio.play();
    } catch {
      musicHint.textContent = '音乐加载失败，请重新打开页面';
      setPlaying(false);
    }
  } else {
    audio.pause();
  }
});

progress.addEventListener('input', () => {
  requestAudio();
  if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration;
  syncMusicProgress();
});

audio.addEventListener('loadedmetadata', syncMusicProgress);
audio.addEventListener('durationchange', syncMusicProgress);
audio.addEventListener('timeupdate', syncMusicProgress);
audio.addEventListener('play', () => setPlaying(true));
audio.addEventListener('pause', () => setPlaying(false));
audio.addEventListener('ended', () => setPlaying(false));
audio.addEventListener('error', () => {
  musicHint.textContent = '音乐加载失败，请重新打开页面';
  setPlaying(false);
});

const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const customCursor = document.querySelector('#custom-cursor');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let cursorFrame = 0;
let pointerX = -100;
let pointerY = -100;
let lastGlitterX = -100;
let lastGlitterY = -100;
let lastGlitterTime = 0;
let glitterIndex = 0;

function drawCursor() {
  customCursor.style.setProperty('--cursor-x', `${pointerX}px`);
  customCursor.style.setProperty('--cursor-y', `${pointerY}px`);
  cursorFrame = 0;
}

function createCursorGlitter(x, y) {
  const glitter = document.createElement('span');
  const size = 3 + Math.random() * 4;
  glitter.className = 'cursor-sparkle';
  glitter.style.left = `${x + (Math.random() - 0.5) * 13}px`;
  glitter.style.top = `${y + 10 + Math.random() * 7}px`;
  glitter.style.setProperty('--glitter-size', `${size}px`);
  glitter.style.setProperty('--glitter-x', `${(Math.random() - 0.5) * 8}px`);
  glitter.style.setProperty('--glitter-drift', `${(Math.random() - 0.5) * 18}px`);
  glitter.style.setProperty('--glitter-fall', `${20 + Math.random() * 20}px`);
  glitter.style.setProperty('--glitter-turn', `${(Math.random() - 0.5) * 60}deg`);
  glitter.style.setProperty('--glitter-life', `${950 + Math.random() * 420}ms`);
  document.body.append(glitter);
  glitter.addEventListener('animationend', () => glitter.remove(), { once: true });
}

function updateCustomCursor(event) {
  pointerX = event.clientX;
  pointerY = event.clientY;
  customCursor.classList.add('is-visible');
  if (!cursorFrame) cursorFrame = window.requestAnimationFrame(drawCursor);
  if (reduceMotion.matches) return;
  const now = performance.now();
  const distance = Math.hypot(pointerX - lastGlitterX, pointerY - lastGlitterY);
  if (distance >= 11 && now - lastGlitterTime >= 42) {
    createCursorGlitter(pointerX, pointerY);
    if (glitterIndex % 3 === 0) createCursorGlitter(pointerX - 5, pointerY + 2);
    glitterIndex += 1;
    lastGlitterX = pointerX;
    lastGlitterY = pointerY;
    lastGlitterTime = now;
  }
}

function enableCustomCursor() {
  document.documentElement.classList.add('has-custom-cursor');
  document.addEventListener('pointermove', updateCustomCursor, { passive: true });
  document.addEventListener('pointerdown', () => customCursor.classList.add('is-pressed'));
  document.addEventListener('pointerup', () => customCursor.classList.remove('is-pressed'));
  document.addEventListener('pointerover', (event) => {
    customCursor.classList.toggle('is-hovering', Boolean(event.target.closest('a, button, input[type="range"]')));
  });
  document.documentElement.addEventListener('mouseleave', () => customCursor.classList.remove('is-visible'));
}

if (finePointer.matches) enableCustomCursor();
