import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, body, scenarios, STEP } from './physics.js';

test('the equal-mass binary retains its separation over one orbit', () => {
  const stars = scenarios.binary.create().slice(0, 2);
  const period = 2 * Math.PI * 53 / Math.abs(stars[0].vy);
  for (let time = 0; time < period; time += STEP) advance(stars, STEP);
  const separation = Math.hypot(stars[0].x - stars[1].x, stars[0].y - stars[1].y);
  assert.ok(Math.abs(separation - 106) < 0.01);
});

test('a massless probe responds to gravity without moving the star', () => {
  const star = body(0, 0, 0, 0, 180000, 23, '#fff');
  const probe = body(100, 0, 0, 0, 0, 4, '#fff');
  advance([star, probe], STEP);
  assert.equal(star.x, 0);
  assert.equal(star.vx, 0);
  assert.ok(probe.x < 100 && probe.vx < 0);
});

test('the flyby probe passes close to the planet without overlapping it', () => {
  const bodies = scenarios.flyby.create();
  const [, planet, probe] = bodies;
  let separation = Infinity;
  for (let time = 0; time < 5; time += STEP) {
    advance(bodies, STEP);
    separation = Math.min(separation, Math.hypot(planet.x - probe.x, planet.y - probe.y));
  }
  assert.ok(separation > planet.radius + probe.radius && separation < 20);
});
