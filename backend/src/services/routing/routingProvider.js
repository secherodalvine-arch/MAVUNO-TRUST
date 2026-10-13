/**
 * RoutingProvider Interface (Contract)
 *
 * Defines the contract for road routing providers (e.g. OSRM, Valhalla, GraphHopper).
 * Decouples the application from any single routing engine.
 */

export class RoutingProvider {
  constructor(name = 'generic_routing_provider') {
    this.name = name;
  }

  /**
   * Calculates a road driving route between origin and destination coordinates.
   *
   * @param {Object} params
   * @param {[number, number]} params.originCoordinates - [longitude, latitude]
   * @param {[number, number]} params.destinationCoordinates - [longitude, latitude]
   * @param {Object} [params.options]
   * @returns {Promise<{
   *   success: boolean,
   *   provider: string,
   *   distanceMeters: number,
   *   distanceKm: number,
   *   durationSeconds: number,
   *   polyline?: string | null,
   *   attribution: string,
   *   originCoordinates: [number, number],
   *   destinationCoordinates: [number, number],
   *   retrievalTimestamp: Date,
   *   code?: string,
   *   message?: string
   * }>}
   */
  async calculateRoute(_params) {
    throw new Error('calculateRoute must be implemented by concrete routing provider');
  }
}
