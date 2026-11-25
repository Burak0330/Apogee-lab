export const G = 1;
export const SOFTENING = 3;
export const STEP = 1 / 120;

function accelerations(bodies) {
  const result = bodies.map(() => ({ x: 0, y: 0 }));
  for (let first = 0; first < bodies.length; first++) {
    for (let second = first + 1; second < bodies.length; second++) {
      const a = bodies[first];
      const b = bodies[second];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const factor = G / (dx * dx + dy * dy + SOFTENING ** 2) ** 1.5;
      result[first].x += dx * factor * b.mass;
      result[first].y += dy * factor * b.mass;
      result[second].x -= dx * factor * a.mass;
      result[second].y -= dy * factor * a.mass;
    }
  }
  return result;
}

export function advance(bodies, dt) {
  const before = accelerations(bodies);
  for (const [index, body] of bodies.entries()) {
    body.x += (body.vx + before[index].x * dt / 2) * dt;
    body.y += (body.vy + before[index].y * dt / 2) * dt;
  }
  const after = accelerations(bodies);
  for (const [index, body] of bodies.entries()) {
    body.vx += (before[index].x + after[index].x) * dt / 2;
    body.vy += (before[index].y + after[index].y) * dt / 2;
  }
}

const palette = ['#ffbb76', '#bb97ff', '#8de5ff', '#fd9cbf'];

export function body(x, y, vx, vy, mass, radius, color) {
  return { x, y, vx, vy, mass, radius, color, trail: [] };
}

function orbit(radius, angle, mass, size, color) {
  const speed = Math.sqrt(G * mass * radius ** 2 / (radius ** 2 + SOFTENING ** 2) ** 1.5);
  return body(radius * Math.cos(angle), radius * Math.sin(angle),
    -speed * Math.sin(angle), speed * Math.cos(angle), 5, size, color);
}

export const scenarios = {
  resonance: {
    title: 'Resonance',
    rings: [79, 125.4, 199],
    create: () => [
      body(0, 0, 0, 0, 180000, 23, palette[0]),
      orbit(79, 0.5, 180000, 5, palette[1]),
      orbit(125.4, 3.7, 180000, 6, palette[2]),
      orbit(199, 5.35, 180000, 7, palette[3]),
    ],
  },
  binary: {
    title: 'Binary stars',
    rings: [53, 190],
    create: () => {
      const radius = 53;
      const mass = 90000;
      const speed = Math.sqrt(G * mass * 2 * radius ** 2 / ((2 * radius) ** 2 + SOFTENING ** 2) ** 1.5);
      return [
        body(-radius, 0, 0, -speed, mass, 18, palette[0]),
        body(radius, 0, 0, speed, mass, 17, palette[2]),
        orbit(190, 4.5, 2 * mass, 5, palette[1]),
      ];
    },
  },
  flyby: {
    title: 'Gravity assist',
    rings: [140],
    create: () => [
      body(0, 0, 0, 0, 180000, 21, palette[0]),
      { ...orbit(140, 0, 180000, 10, palette[2]), mass: 1800 },
      body(194, -160, -20, 90, 0, 4, palette[3]),
    ],
  },
};
