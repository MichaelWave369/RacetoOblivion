// Collision map for Elsewhen's explorable plaza. Coordinates match the 960x560 canvas.
export const townObstacles = [
  { x: 87, y: 279, w: 97, h: 74 },
  { x: 777, y: 279, w: 98, h: 74 },
  { x: 321, y: 222, w: 94, h: 66 },
  { x: 546, y: 222, w: 94, h: 66 },
  { x: 453, y: 157, w: 54, h: 75 },
  { x: 48, y: 411, w: 85, h: 72 },
  { x: 825, y: 414, w: 88, h: 65 }
];

export function blocked(scene, x, y, radius = 12) {
  if (x < 24 + radius || x > 936 - radius || y < 48 + radius || y > 540 - radius) return true;
  if (scene !== "elsewhen") return false;
  return townObstacles.some((r) =>
    x + radius > r.x && x - radius < r.x + r.w &&
    y + radius > r.y && y - radius < r.y + r.h
  );
}

export function stepPosition(scene, x, y, dx, dy, step) {
  if (![x, y, dx, dy, step].every(Number.isFinite) || step <= 0) return { x, y };
  const distance = Math.hypot(dx, dy);
  if (!distance) return { x, y };
  const pace = Math.min(step, 12);
  const count = Math.ceil(step / pace);
  const vx = dx / distance * step / count;
  const vy = dy / distance * step / count;
  for (let i = 0; i < count; i++) {
    if (!blocked(scene, x + vx, y)) x += vx;
    if (!blocked(scene, x, y + vy)) y += vy;
  }
  return { x, y };
}
