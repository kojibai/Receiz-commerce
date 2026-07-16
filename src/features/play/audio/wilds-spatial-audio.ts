export type WildsAudioPosition = Readonly<{ x: number; y?: number; z: number }>;

export type WildsSpatialProjection = Readonly<{
  x: number;
  y: number;
  z: number;
  distance: number;
  audible: boolean;
}>;

export function projectWildsSpatialEmitter(input: {
  listener: WildsAudioPosition;
  source: WildsAudioPosition;
  maxDistance: number;
}): WildsSpatialProjection {
  const x = input.source.x - input.listener.x;
  const y = (input.source.y ?? 0) - (input.listener.y ?? 0);
  const z = input.source.z - input.listener.z;
  const distance = Math.hypot(x, y, z);
  return { x, y, z, distance, audible: distance <= Math.max(0, input.maxDistance) };
}

export function wildsDistanceAttenuation(distance: number, maxDistance: number) {
  if (!Number.isFinite(distance) || !Number.isFinite(maxDistance) || maxDistance <= 0) return 0;
  const normalized = Math.min(1, Math.max(0, distance / maxDistance));
  const smooth = normalized * normalized * (3 - 2 * normalized);
  return 1 - smooth;
}
