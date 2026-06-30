export function randomInt(min, max) {
  const safeMin = Number(min) || 1;
  const safeMax = Math.max(Number(max) || safeMin, safeMin);
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

export function createOrderCode() {
  return `DH${Date.now().toString().slice(-8)}${randomInt(10, 99)}`;
}
