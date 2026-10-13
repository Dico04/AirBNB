// Solar position (NOAA-style approximation, accurate to ~0.1°) and conversion to scene directions.
import * as THREE from 'three';
import { SITE } from '../apartment.config.js';

const rad = Math.PI / 180;

// Returns { altitude, azimuth } in degrees (azimuth clockwise from true north) for a UTC Date.
export function solarPosition(date, lat = SITE.lat, lon = SITE.lon) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (((gmst + lon / 15) % 24) + 24) % 24 * 15 * rad;
  const H = lst - ra;
  const la = lat * rad;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(-Math.sin(H), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(H));
  return { altitude: alt / rad, azimuth: ((az / rad) % 360 + 360) % 360 };
}

// Local wall-clock time (decimal hours) on SITE.defaultDate → UTC Date.
export function localTimeToDate(hours, [y, m, d] = SITE.defaultDate, utcOffset = SITE.utcOffsetHours) {
  const ms = Date.UTC(y, m - 1, d, 0, 0, 0) + (hours - utcOffset) * 3600000;
  return new Date(ms);
}

// Unit vector (Three.js world) pointing from the scene toward a true bearing / altitude.
// Plan bearing = true bearing - planNorthBearing; plan north = -z, plan east = +x.
export function directionFromBearing(trueBearingDeg, altitudeDeg, target = new THREE.Vector3()) {
  const pb = (trueBearingDeg - SITE.planNorthBearingDeg) * rad;
  const alt = altitudeDeg * rad;
  return target.set(Math.sin(pb) * Math.cos(alt), Math.sin(alt), -Math.cos(pb) * Math.cos(alt)).normalize();
}

export function sunDirection(hours, target) {
  const { altitude, azimuth } = solarPosition(localTimeToDate(hours));
  return { dir: directionFromBearing(azimuth, altitude, target), altitude, azimuth };
}
