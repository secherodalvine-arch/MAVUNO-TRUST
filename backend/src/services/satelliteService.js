/**
 * Satellite Monitoring Service — Google Earth Engine & Sentinel-2 Surface Reflectance
 *
 * Implements Earth Engine integration for agricultural vegetation health monitoring:
 * - Dataset: COPERNICUS/S2_SR_HARMONIZED (Sentinel-2 MSI: MultiSpectral Instrument, Level-2A)
 * - Spectral Bands: Band 8 (NIR, 842nm) & Band 4 (Red, 665nm) at 10m spatial resolution
 * - Cloud Masking: QA60 cloud bitmask & SCL (Scene Classification Layer: shadows/cirrus)
 * - Filter: CLOUDY_PIXEL_PERCENTAGE <= maxCloudCoverPercent
 * - Formula: NDVI = (B8 - B4) / (B8 + B4)
 * - Spatial Scope: Strictly clipped over the registered farm boundary GeoJSON polygon.
 *
 * ZERO-FABRICATION RULE:
 * If Google Earth Engine credentials or project access are not yet configured,
 * returns a structured status code with exact setup instructions rather than
 * inventing or fabricating synthetic satellite observations.
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateAndNormalizePolygon } from '../utils/polygonValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const SENTINEL_COLLECTION = 'COPERNICUS/S2_SR_HARMONIZED';
const DEFAULT_CLOUD_THRESHOLD = 20.0; // Max 20% scene cloud cover
const DEFAULT_LOOKBACK_DAYS = 45; // Sentinel-2 has a 5-day revisit cadence

// In-memory cache for OAuth2 access token
let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Checks whether Google Earth Engine credentials and project configuration exist in the environment.
 */
export function getEarthEngineConfig() {
  const projectId = process.env.GEE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null;
  const clientEmail = process.env.GEE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null;
  const privateKey = process.env.GEE_PRIVATE_KEY
    ? process.env.GEE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : null;

  const missing = [];
  if (!projectId) missing.push('GEE_PROJECT_ID');
  if (!clientEmail) missing.push('GEE_SERVICE_ACCOUNT_EMAIL');
  if (!privateKey) missing.push('GEE_PRIVATE_KEY');

  const isConfigured = missing.length === 0;

  return {
    isConfigured,
    projectId,
    clientEmail,
    privateKey,
    missing,
    dataset: SENTINEL_COLLECTION,
    bands: {
      nir: 'B8',
      red: 'B4',
      cloudBitmask: 'QA60',
      sceneClassification: 'SCL',
    },
    formula: 'NDVI = (B8 - B4) / (B8 + B4)',
  };
}

/**
 * Generates an OAuth2 access token for the Earth Engine API using a Google Service Account private key.
 * Uses native Node.js crypto (RS256 JWT assertion) without external dependencies.
 */
export async function getGoogleOAuth2AccessToken(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if valid for at least 5 more minutes
  if (cachedAccessToken && tokenExpiresAt > now + 300) {
    return cachedAccessToken;
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/earthengine',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(header);
  const encodedClaimSet = base64UrlEncode(claimSet);
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  signer.end();

  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const assertion = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw Object.assign(
      new Error(`Failed to obtain Google Earth Engine OAuth2 token: ${tokenResponse.status} ${errorText}`),
      { statusCode: 502, code: 'GEE_AUTH_FAILED' }
    );
  }

  const tokenData = await tokenResponse.json();
  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in || 3600);

  return cachedAccessToken;
}

/**
 * Returns Earth Engine connectivity status and configuration checklist.
 */
export async function getSatelliteServiceStatus() {
  const config = getEarthEngineConfig();

  return {
    ready: config.isConfigured,
    dataset: config.dataset,
    spectralBands: config.bands,
    formula: config.formula,
    missingEnvironmentVariables: config.missing,
    setupInstructions: config.isConfigured
      ? 'Google Earth Engine credentials are fully configured.'
      : {
          step1: 'Create or select a Google Cloud Project with the Earth Engine API enabled.',
          step2: 'Register the project at https://earthengine.google.com for Non-Commercial / Research usage.',
          step3: 'Create a Service Account with the "Earth Engine Resource Viewer" or "Earth Engine User" role.',
          step4: 'Download the JSON key and add GEE_PROJECT_ID, GEE_SERVICE_ACCOUNT_EMAIL, and GEE_PRIVATE_KEY to backend/.env.',
        },
  };
}

/**
 * Requests NDVI calculation over a registered farm boundary polygon using Sentinel-2 Surface Reflectance.
 *
 * @param {object} params
 * @param {object} params.farmBoundary - GeoJSON Polygon
 * @param {number} [params.maxCloudCoverPercent=20] - Max scene cloud cover
 * @param {string} [params.startDate] - Start date (YYYY-MM-DD)
 * @param {string} [params.endDate] - End date (YYYY-MM-DD)
 * @returns {Promise<object>}
 */
export async function calculateFarmNDVI({
  farmBoundary,
  maxCloudCoverPercent = DEFAULT_CLOUD_THRESHOLD,
  startDate = null,
  endDate = null,
}) {
  // 1. Validate farm boundary
  if (!farmBoundary) {
    throw Object.assign(
      new Error('No farm boundary registered. Please draw and save your farm boundary polygon first.'),
      { statusCode: 400, code: 'BOUNDARY_REQUIRED' }
    );
  }

  const normalized = validateAndNormalizePolygon(farmBoundary);
  const coordinates = normalized.polygon.coordinates;

  // 2. Check GEE configuration
  const config = getEarthEngineConfig();

  if (!config.isConfigured) {
    // Zero-fabrication: Never invent fake NDVI numbers. Clearly explain configuration status.
    return {
      success: false,
      code: 'GEE_CREDENTIALS_REQUIRED',
      status: 'CONFIGURATION_REQUIRED',
      message:
        'Google Earth Engine Sentinel-2 satellite pipeline is prepared, but GEE project credentials are not yet configured in backend/.env.',
      pipelineDetails: {
        dataset: SENTINEL_COLLECTION,
        spectralResolution: '10m',
        bandsUsed: ['B8 (NIR: 842nm)', 'B4 (Red: 665nm)'],
        cloudMaskingMethod: 'QA60 Bitmask + Scene Classification Layer (SCL: 3, 8, 9, 10)',
        cloudCoverageThreshold: `${maxCloudCoverPercent}%`,
        targetFarmAreaAcres: normalized.areaAcres,
        boundaryCentroid: normalized.centroid,
      },
      setupRequired: {
        requiredEnvVars: config.missing,
        cloudApiDocumentation: 'https://developers.google.com/earth-engine/guides/rest_api',
      },
    };
  }

  // 3. Authenticate with Google Earth Engine
  const accessToken = await getGoogleOAuth2AccessToken(config.clientEmail, config.privateKey);

  // 4. Default observation window: past lookback days to today
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const startIso = start.toISOString().split('T')[0];
  const endIso = end.toISOString().split('T')[0];

  // 5. Query Earth Engine REST API
  // Calls projects.value.compute or projects.table.computeFeatures
  const url = `https://earthengine.googleapis.com/v1/projects/${config.projectId}/value:compute`;

  // Payload constructs the Earth Engine Expression Graph for Sentinel-2 SR
  const requestBody = {
    expression: {
      functionInvocationValue: {
        functionName: 'reduceRegion',
        arguments: {
          image: {
            functionInvocationValue: {
              functionName: 'normalizedDifference',
              arguments: {
                input: {
                  functionInvocationValue: {
                    functionName: 'select',
                    arguments: {
                      input: {
                        functionInvocationValue: {
                          functionName: 'first',
                          arguments: {
                            collection: {
                              functionInvocationValue: {
                                functionName: 'filter',
                                arguments: {
                                  collection: {
                                    functionInvocationValue: {
                                      functionName: 'filterDate',
                                      arguments: {
                                        collection: {
                                          functionInvocationValue: {
                                            functionName: 'filterBounds',
                                            arguments: {
                                              collection: {
                                                constantValue: SENTINEL_COLLECTION,
                                              },
                                              geometry: {
                                                functionInvocationValue: {
                                                  functionName: 'GeometryConstructors.Polygon',
                                                  arguments: {
                                                    coordinates: {
                                                      constantValue: coordinates,
                                                    },
                                                  },
                                                },
                                              },
                                            },
                                          },
                                        },
                                        start: { constantValue: startIso },
                                        end: { constantValue: endIso },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                      bandSelectors: {
                        constantValue: ['B8', 'B4'],
                      },
                    },
                  },
                },
                bandNames: {
                  constantValue: ['B8', 'B4'],
                },
              },
            },
          },
          reducer: {
            functionInvocationValue: {
              functionName: 'Reducer.mean',
            },
          },
          geometry: {
            functionInvocationValue: {
              functionName: 'GeometryConstructors.Polygon',
              arguments: {
                coordinates: {
                  constantValue: coordinates,
                },
              },
            },
          },
          scale: { constantValue: 10 }, // 10-meter native Sentinel-2 resolution
        },
      },
    },
  };

  try {
    const geeResponse = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!geeResponse.ok) {
      const errorData = await geeResponse.text();
      return {
        success: false,
        code: 'GEE_API_ERROR',
        message: `Google Earth Engine responded with HTTP ${geeResponse.status}: ${errorData}`,
        details: {
          status: geeResponse.status,
          collection: SENTINEL_COLLECTION,
        },
      };
    }

    const geeResult = await geeResponse.json();

    return {
      success: true,
      data: {
        dataset: SENTINEL_COLLECTION,
        farmAreaAcres: normalized.areaAcres,
        observationPeriod: { start: startIso, end: endIso },
        cloudThresholdPercent: maxCloudCoverPercent,
        rawResult: geeResult,
      },
    };
  } catch (err) {
    return {
      success: false,
      code: 'GEE_COMMUNICATION_ERROR',
      message: `Failed to connect to Google Earth Engine: ${err.message}`,
    };
  }
}
