import { advance, body, scenarios, STEP } from './physics.js';

const canvas = document.querySelector('#space');
const context = canvas.getContext('2d');
const speed = document.querySelector('#speed');
const pause = document.querySelector('#pause');
const trails = document.querySelector('#trails');
const count = document.querySelector('#count');
const elapsed = document.querySelector('#elapsed');
const status = document.querySelector('#status');
const presetButtons = [...document.querySelectorAll('[data-preset]')];

let scenario = scenarios.resonance;
let bodies, originalBodyCount, time, accumulator, ticks;
let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
let drag = null;
let viewport;

function reset() {
  bodies = scenario.create();
  originalBodyCount = bodies.length;
  time = accumulator = ticks = 0;
  drag = null;
  count.textContent = bodies.length;
  elapsed.textContent = '0.0';
}

function updatePlayback() {
  status.textContent = paused ? '○ PAUSED' : '● RUNNING';
  pause.textContent = paused ? '▷ Resume' : 'Ⅱ Pause';
}
reset();
updatePlayback();

for (const button of presetButtons) {
  button.addEventListener('click', () => {
    scenario = scenarios[button.dataset.preset];
    document.querySelector('#scenario').textContent = scenario.title.toUpperCase();
    for (const option of presetButtons) option.setAttribute('aria-pressed', option === button);
    reset();
  });
}

pause.addEventListener('click', () => {
  paused = !paused;
  updatePlayback();
});
document.querySelector('#reset').addEventListener('click', reset);
speed.addEventListener('input', () => {
  document.querySelector('#speed-value').textContent = speed.value + '×';
});

function resize() {
  const { width, height } = canvas.getBoundingClientRect();
  const pixelRatio = Math.min(devicePixelRatio, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  viewport = { width, height, pixelRatio, scale: Math.min(width / 470, height / 465) };
}

new ResizeObserver(resize).observe(canvas);
resize();

function pointer(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - viewport.width / 2) / viewport.scale,
    y: (event.clientY - rect.top - viewport.height / 2) / viewport.scale,
  };
}

function launch(from, to) {
  if (bodies.length === 28) bodies.splice(originalBodyCount, 1);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const strength = Math.min(0.75, 130 / (Math.hypot(dx, dy) || 1));
  bodies.push(body(from.x, from.y, dx * strength, dy * strength, 0, 3.5, '#b7ffd8'));
  count.textContent = bodies.length;
}

canvas.addEventListener('pointerdown', event => {
  if (drag || event.button !== 0) return;
  const point = pointer(event);
  drag = { id: event.pointerId, from: point, to: point };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (drag?.id === event.pointerId) drag.to = pointer(event);
});
canvas.addEventListener('pointerup', event => {
  if (drag?.id !== event.pointerId) return;
  launch(drag.from, pointer(event));
  drag = null;
});
canvas.addEventListener('lostpointercapture', event => {
  if (drag?.id === event.pointerId) drag = null;
});
canvas.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.repeat) launch({ x: -162, y: 0 }, { x: -162, y: -44 });
});

const stars = Array.from({ length: 230 }, (_, index) => ({
  x: ((index * 991 + 51) % 2017) / 2017,
  y: ((index * index * 173 + 23) % 2027) / 2027,
  radius: index % 21 === 0 ? 1.2 : 0.55,
  opacity: 0.15 + (index % 11) / 24,
}));

function drawBackground(width, height) {
  const glow = context.createRadialGradient(width / 2, height / 2, 4, width / 2, height / 2, width * 0.55);
  glow.addColorStop(0, '#241631');
  glow.addColorStop(0.58, '#141022');
  glow.addColorStop(1, '#090914');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  for (const star of stars) {
    context.fillStyle = `rgba(209,191,255,${star.opacity})`;
    context.fillRect(star.x * width, star.y * height, star.radius, star.radius);
  }
  context.beginPath();
  for (let x = width / 2 % 32; x < width; x += 32) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = height / 2 % 32; y < height; y += 32) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.strokeStyle = '#b29ee215';
  context.stroke();
}

function drawBody(item) {
  if (trails.checked && item.trail.length > 1) {
    context.strokeStyle = item.color;
    context.lineWidth = 1.6;
    for (let offset = 0; offset < item.trail.length - 1; offset += 8) {
      context.globalAlpha = 0.08 + 0.62 * offset / item.trail.length;
      context.beginPath();
      context.moveTo(...item.trail[offset]);
      for (const point of item.trail.slice(offset + 1, offset + 9)) context.lineTo(...point);
      context.stroke();
    }
    context.globalAlpha = 1;
  }

  const halo = context.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.radius * 4.2);
  halo.addColorStop(0, item.color + 'ce');
  halo.addColorStop(.33, item.color + '4d');
  halo.addColorStop(1, item.color + '00');
  context.fillStyle = halo;
  context.fillRect(item.x - item.radius * 4.2, item.y - item.radius * 4.2, item.radius * 8.4, item.radius * 8.4);

  const sphere = context.createRadialGradient(item.x - item.radius * .3, item.y - item.radius * .35,
    0, item.x, item.y, item.radius);
  sphere.addColorStop(0, '#fff8e8');
  sphere.addColorStop(.65, item.color);
  sphere.addColorStop(1, item.mass > 10000 ? '#ed794b' : item.color + '99');
  context.fillStyle = sphere;
  context.beginPath();
  context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
  context.fill();
}

function render() {
  const { width, height, pixelRatio, scale } = viewport;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  drawBackground(width, height);
  context.translate(width / 2, height / 2);
  context.scale(scale, scale);
  context.strokeStyle = '#c4a4ff48';
  context.lineWidth = 1;
  context.setLineDash([2, 5]);
  for (const radius of scenario.rings) {
    context.beginPath();
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
  }
  context.setLineDash([]);
  for (const item of bodies) drawBody(item);
  if (drag) {
    context.strokeStyle = '#b7ffd8';
    context.beginPath();
    context.moveTo(drag.from.x, drag.from.y);
    context.lineTo(drag.to.x, drag.to.y);
    context.stroke();
  }
}

let previous = performance.now();
function frame(now) {
  if (!paused) {
    accumulator += Math.min((now - previous) / 1000, .05) * Number(speed.value);
    while (accumulator >= STEP) {
      advance(bodies, STEP);
      accumulator -= STEP;
      time += STEP;
      if (++ticks % 5 === 0) {
        for (const item of bodies) {
          item.trail.push([item.x, item.y]);
          if (item.trail.length > 340) item.trail.shift();
        }
      }
    }
    elapsed.textContent = time.toFixed(1);
  }
  previous = now;
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
