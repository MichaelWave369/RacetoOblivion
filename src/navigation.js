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

export function blocked(scene, x, y, radius = 12, state = null) {
  if (x < 24 + radius || x > 936 - radius || y < 48 + radius || y > 540 - radius) return true;
  if (scene === "crossing") {
    // A continuous water channel separates the two banks. Only the chosen
    // bridge admits a player with a finite collision radius. There is no
    // path around the channel at the outer map bounds.
    if (y + radius > 295 && y - radius < 355) {
      const gaps = {west:[151,229],center:[443,517],east:[735,821]};
      const chosen = state?.crossing?.chosen;
      const gap = Object.hasOwn(gaps,chosen) ? gaps[chosen] : null;
      if (!gap || x - radius < gap[0] || x + radius > gap[1]) return true;
    }
    return false;
  }
  if (scene !== "elsewhen") return false;
  return townObstacles.some((r) =>
    x + radius > r.x && x - radius < r.x + r.w &&
    y + radius > r.y && y - radius < r.y + r.h
  );
}

export function stepPosition(scene, x, y, dx, dy, step, state = null) {
  if (![x, y, dx, dy, step].every(Number.isFinite) || step <= 0) return { x, y };
  const distance = Math.hypot(dx, dy);
  if (!distance) return { x, y };
  const pace = Math.min(step, 12);
  const count = Math.ceil(step / pace);
  const vx = dx / distance * step / count;
  const vy = dy / distance * step / count;
  for (let i = 0; i < count; i++) {
    if (!blocked(scene, x + vx, y, 12, state)) x += vx;
    if (!blocked(scene, x, y + vy, 12, state)) y += vy;
  }
  return { x, y };
}
