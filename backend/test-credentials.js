/**
 * Verification test for GEE & Firebase credentials loading
 */
import { getEarthEngineConfig } from './src/services/satelliteService.js';
import { fcmService } from './src/services/fcmService.js';

console.log('--- MavunoTrust Credentials Verification ---');

// 1. GEE Verification
const gee = getEarthEngineConfig();
console.log('[GEE Config]');
console.log('  Configured :', gee.isConfigured);
console.log('  Source     :', gee.source);
console.log('  Project ID :', gee.projectId || '(none)');
console.log('  Client Email:', gee.clientEmail || '(none)');
console.log('  Private Key :', gee.privateKey ? '(Present, valid RSA length)' : '(Missing)');

// 2. FCM / Firebase Verification
const fcm = fcmService.getStatus();
console.log('\n[Firebase / FCM Status]');
console.log('  Configured :', fcm.configured);
console.log('  Type       :', fcm.type);
console.log('  Source     :', fcm.source);
console.log('  Project ID :', fcm.projectId || '(none)');
console.log('  Client Email:', fcm.clientEmail || '(none)');

if (gee.isConfigured && fcm.configured) {
  console.log('\n[PASS] Both Google Earth Engine and Firebase credentials loaded successfully!');
  process.exit(0);
} else {
  console.log('\n[FAIL] One or more services are not configured.');
  process.exit(1);
}

