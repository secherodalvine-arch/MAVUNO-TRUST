/**
 * GeoJSON Polygon Validation & Geodesic Area Calculation Utility
 *
 * Implements strict geometric validation for farm boundaries:
 * 1. GeoJSON format compliance (Outer ring, [longitude, latitude]).
 * 2. Latitude/Longitude bounding checks.
 * 3. Closure validation (first point == last point).
 * 4. Self-intersection detection for simple polygons.
 * 5. Accurate geodesic area calculation in square meters, acres, and hectares.
 * 6. Centroid calculation.
 */

const EARTH_RADIUS_METERS = 6378137.0; // WGS84 Earth equatorial radius
const SQ_METERS_PER_ACRE = 4046.8564224;

const toRadians = (degrees) => (degrees * Math.PI) / 180.0;
const toDegrees = (radians) => (radians * 180.0) / Math.PI;

/**
 * Checks whether two 2D line segments AB and CD intersect.
 * Segments sharing an endpoint are not considered self-intersecting.
 */
function ccw(p1, p2, p3) {
  return (p3[1] - p1[1]) * (p2[0] - p1[0]) > (p2[1] - p1[1]) * (p3[0] - p1[0]);
}

function segmentsIntersect(a, b, c, d) {
  // If segments share a common endpoint, they do not self-intersect
  const eps = 1e-9;
  const isSame = (p, q) => Math.abs(p[0] - q[0]) < eps && Math.abs(p[1] - q[1]) < eps;
  if (isSame(a, c) || isSame(a, d) || isSame(b, c) || isSame(b, d)) {
    return false;
  }

  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}

/**
 * Validates that a linear ring has no self-intersecting edges.
 */
export function hasSelfIntersections(ring) {
  const n = ring.length - 1; // Last point equals first point
  if (n < 3) return false;

  for (let i = 0; i < n; i++) {
    const a1 = ring[i];
    const a2 = ring[i + 1];

    for (let j = i + 1; j < n; j++) {
      // Skip adjacent segments
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) {
        continue;
      }

      const b1 = ring[j];
      const b2 = ring[j + 1];

      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Computes the geodesic area of a polygon ring in square meters using spherical excess.
 *
 * @param {Array<Array<number>>} ring - Array of [longitude, latitude] coordinate pairs
 * @returns {number} Area in square meters
 */
export function calculateGeodesicArea(ring) {
  if (!Array.isArray(ring) || ring.length < 4) {
    return 0;
  }

  let total = 0;
  const len = ring.length;

  for (let i = 0; i < len - 1; i++) {
    const p1 = ring[i];
    const p2 = ring[i + 1];

    const lon1 = toRadians(p1[0]);
    const lat1 = toRadians(p1[1]);
    const lon2 = toRadians(p2[0]);
    const lat2 = toRadians(p2[1]);

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const areaSqMeters = Math.abs((total * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2.0);
  return areaSqMeters;
}

/**
 * Computes the centroid [longitude, latitude] of a polygon.
 */
export function calculateCentroid(ring) {
  if (!Array.isArray(ring) || ring.length === 0) {
    return null;
  }

  let sumLng = 0;
  let sumLat = 0;
  const count = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
    ? ring.length - 1
    : ring.length;

  for (let i = 0; i < count; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }

  return [
    parseFloat((sumLng / count).toFixed(6)),
    parseFloat((sumLat / count).toFixed(6)),
  ];
}

/**
 * Normalizes and strictly validates a polygon boundary input.
 * Accepts:
 *  - GeoJSON Polygon: { type: 'Polygon', coordinates: [[[lng, lat], ...]] }
 *  - Raw array of rings: [[[lng, lat], ...]]
 *  - Array of points: [[lng, lat], ...] or [{ lat, lng }, ...]
 *
 * @param {any} input
 * @returns {{ valid: boolean, polygon: { type: 'Polygon', coordinates: Array<Array<Array<number>>> }, areaAcres: number, areaHectares: number, centroid: [number, number] }}
 */
export function validateAndNormalizePolygon(input) {
  if (!input) {
    throw Object.assign(new Error('Farm boundary input is required.'), {
      statusCode: 400,
      code: 'EMPTY_BOUNDARY',
    });
  }

  let rawCoordinates = null;

  if (typeof input === 'object') {
    if (input.type === 'Polygon' && Array.isArray(input.coordinates)) {
      rawCoordinates = input.coordinates;
    } else if (Array.isArray(input.coordinates)) {
      rawCoordinates = input.coordinates;
    } else if (Array.isArray(input)) {
      // Check if input is [[[lng, lat], ...]] or [[lng, lat], ...]
      if (Array.isArray(input[0]) && Array.isArray(input[0][0])) {
        rawCoordinates = input;
      } else {
        rawCoordinates = [input];
      }
    }
  }

  if (!rawCoordinates || !Array.isArray(rawCoordinates) || rawCoordinates.length === 0) {
    throw Object.assign(
      new Error('Invalid GeoJSON Polygon: coordinates array must contain at least one linear ring.'),
      { statusCode: 400, code: 'INVALID_POLYGON_STRUCTURE' }
    );
  }

  // Normalize outer linear ring
  const outerRingRaw = rawCoordinates[0];
  if (!Array.isArray(outerRingRaw) || outerRingRaw.length < 3) {
    throw Object.assign(
      new Error('A farm boundary polygon requires at least 3 distinct corner coordinates.'),
      { statusCode: 400, code: 'INSUFFICIENT_VERTICES' }
    );
  }

  const normalizedRing = [];

  for (let i = 0; i < outerRingRaw.length; i++) {
    const pt = outerRingRaw[i];
    let lng = null;
    let lat = null;

    if (Array.isArray(pt) && pt.length >= 2) {
      lng = Number(pt[0]);
      lat = Number(pt[1]);
    } else if (typeof pt === 'object' && pt !== null) {
      if (pt.lng !== undefined && pt.lat !== undefined) {
        lng = Number(pt.lng);
        lat = Number(pt.lat);
      } else if (pt.longitude !== undefined && pt.latitude !== undefined) {
        lng = Number(pt.longitude);
        lat = Number(pt.latitude);
      }
    }

    if (lng === null || lat === null || isNaN(lng) || isNaN(lat) || !Number.isFinite(lng) || !Number.isFinite(lat)) {
      throw Object.assign(
        new Error(`Coordinate at point ${i + 1} is invalid. Each vertex must have numeric latitude and longitude.`),
        { statusCode: 400, code: 'INVALID_COORDINATE_VALUE' }
      );
    }

    if (lng < -180 || lng > 180) {
      throw Object.assign(
        new Error(`Longitude ${lng} at point ${i + 1} is out of bounds (-180 to 180 degrees).`),
        { statusCode: 400, code: 'COORDINATE_OUT_OF_BOUNDS' }
      );
    }

    if (lat < -90 || lat > 90) {
      throw Object.assign(
        new Error(`Latitude ${lat} at point ${i + 1} is out of bounds (-90 to 90 degrees).`),
        { statusCode: 400, code: 'COORDINATE_OUT_OF_BOUNDS' }
      );
    }

    normalizedRing.push([parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))]);
  }

  // Deduplicate consecutive identical coordinates
  const cleanRing = [];
  for (let i = 0; i < normalizedRing.length; i++) {
    const pt = normalizedRing[i];
    if (cleanRing.length === 0) {
      cleanRing.push(pt);
    } else {
      const prev = cleanRing[cleanRing.length - 1];
      if (Math.abs(pt[0] - prev[0]) > 1e-6 || Math.abs(pt[1] - prev[1]) > 1e-6) {
        cleanRing.push(pt);
      }
    }
  }

  // Ensure linear ring closure: First and last coordinates must be identical
  const first = cleanRing[0];
  const last = cleanRing[cleanRing.length - 1];
  const eps = 1e-6;

  if (Math.abs(first[0] - last[0]) > eps || Math.abs(first[1] - last[1]) > eps) {
    // Auto-close polygon ring by repeating the starting coordinate
    cleanRing.push([...first]);
  }

  // Must have at least 4 points once closed (3 unique vertices)
  if (cleanRing.length < 4) {
    throw Object.assign(
      new Error('Farm boundary polygon must have at least 3 unique corner vertices.'),
      { statusCode: 400, code: 'INSUFFICIENT_VERTICES' }
    );
  }

  let effectiveRing = cleanRing;

  // If the polygon has self-intersections or near-zero area, attempt smart radial ordering
  if (hasSelfIntersections(effectiveRing) || calculateGeodesicArea(effectiveRing) < 1.0) {
    const uniqueVertices = cleanRing.slice(0, cleanRing.length - 1);
    if (uniqueVertices.length >= 3) {
      const cLng = uniqueVertices.reduce((s, p) => s + p[0], 0) / uniqueVertices.length;
      const cLat = uniqueVertices.reduce((s, p) => s + p[1], 0) / uniqueVertices.length;

      const radiallySorted = [...uniqueVertices].sort((a, b) => {
        return Math.atan2(a[1] - cLat, a[0] - cLng) - Math.atan2(b[1] - cLat, b[0] - cLng);
      });
      radiallySorted.push([...radiallySorted[0]]);

      const sortedArea = calculateGeodesicArea(radiallySorted);
      if (sortedArea >= 1.0 && !hasSelfIntersections(radiallySorted)) {
        effectiveRing = radiallySorted;
      }
    }
  }

  // Check for self-intersections
  if (hasSelfIntersections(effectiveRing)) {
    throw Object.assign(
      new Error('Invalid farm boundary: The polygon edges self-intersect. Please adjust the perimeter corners so boundary lines do not cross each other.'),
      { statusCode: 400, code: 'POLYGON_SELF_INTERSECTION' }
    );
  }

  // Compute area
  const areaSqMeters = calculateGeodesicArea(effectiveRing);
  const areaAcres = parseFloat((areaSqMeters / SQ_METERS_PER_ACRE).toFixed(2));
  const areaHectares = parseFloat((areaSqMeters / 10000).toFixed(2));

  if (areaSqMeters < 1.0) {
    throw Object.assign(
      new Error('Farm boundary has zero or near-zero area. The corner pins appear to be placed in a straight line or overlapping. Please drag the corner pins outward on the map to enclose your farm parcel.'),
      { statusCode: 400, code: 'DEGENERATE_POLYGON' }
    );
  }

  // Sanity check: single farm boundary should not exceed 50,000 acres
  if (areaAcres > 50000) {
    throw Object.assign(
      new Error(`Boundary area (${areaAcres.toLocaleString()} acres) exceeds plausible agricultural farm bounds. Please verify your coordinates.`),
      { statusCode: 400, code: 'POLYGON_AREA_EXCESSIVE' }
    );
  }

  const centroid = calculateCentroid(effectiveRing);

  return {
    valid: true,
    polygon: {
      type: 'Polygon',
      coordinates: [effectiveRing],
    },
    areaSqMeters: Math.round(areaSqMeters),
    areaAcres,
    areaHectares,
    centroid,
  };
}
