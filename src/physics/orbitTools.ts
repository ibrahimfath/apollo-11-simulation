// src/physics/orbitUtils.ts
import * as THREE from "three";

export interface OrbitElements {
  sma: number | null;    // semi-major axis (m) or null
  ecc: number;           // eccentricity
  rp: number | null;     // periapsis radius (m) or null
  ra: number | null;     // apoapsis radius (m) or null
  period: number | null; // orbital period (s) or null
  p: number | null;      // semi-latus rectum (m) or null
  isBound: boolean;      // true for elliptical orbits (e < 1)
}

/**
 * Compute two-body orbital elements for r and v **relative to the central body**.
 * - r, v expected in SI units (meters, m/s)
 * - mu = G * M (m^3/s^2)
 *
 * Returns null/NaN-safe values (null where a quantity is undefined).
 */
export function computeOrbitElements(
  r: THREE.Vector3,
  v: THREE.Vector3,
  mu: number
): OrbitElements {
  const rMag = r.length();
  const vMag = v.length();

  if (rMag <= 0 || mu <= 0) {
    return { sma: null, ecc: 0, rp: null, ra: null, period: null, p: null, isBound: false };
  }

  // angular momentum vector h = r x v
  const hVec = new THREE.Vector3().crossVectors(r, v);
  const hMag = hVec.length();

  // eccentricity vector: e = (v x h)/mu - r/|r|
  const eVec = new THREE.Vector3().crossVectors(v, hVec).multiplyScalar(1 / mu)
    .sub(r.clone().multiplyScalar(1 / rMag));
  const ecc = eVec.length();

  // specific orbital energy
  const energy = 0.5 * vMag * vMag - mu / rMag;

  // semi-latus rectum p = h^2 / mu (if h>0)
  const p = hMag > 0 ? (hMag * hMag) / mu : null;

  // periapsis (if p exists)
  const rp = p !== null ? p / (1 + ecc) : null;

  // Determine bound/unbound
  const isBound = ecc < 1 && energy < 0;

  // apoapsis only valid for elliptical orbits
  const ra = (p !== null && isBound) ? p / (1 - ecc) : null;

  // semi-major axis (use energy when possible; may be negative for hyperbola)
  let sma: number | null = null;
  if (Math.abs(energy) > 1e-16) {
    sma = -mu / (2 * energy);
  } else if (isBound && p !== null) {
    // near-parabolic fallback
    sma = p / (1 - ecc * ecc);
  }

  // orbital period only for ellipse
  const period = (sma !== null && isBound) ? 2 * Math.PI * Math.sqrt(Math.pow(sma, 3) / mu) : null;

  return { sma, ecc, rp, ra, period, p, isBound };
}

/** Friendly formatting helpers */
export function formatDistanceKm(meters: number | null): string {
  if (meters === null) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatSmaKm(meters: number | null): string {
  if (meters === null) return "—";
  // if extremely large treat as "very large"
  if (!isFinite(meters)) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatPeriod(s: number | null): string {
  if (s === null || !isFinite(s)) return "—";
  if (s < 60) return `${s.toFixed(1)} s`;
  const mins = s / 60;
  if (mins < 60) return `${mins.toFixed(2)} min`;
  const hours = mins / 60;
  if (hours < 24) return `${hours.toFixed(3)} h`;
  const days = hours / 24;
  return `${days.toFixed(3)} d`;
}
